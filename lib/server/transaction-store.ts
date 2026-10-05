import fs from "fs";
import path from "path";
import { BillData, BillCalculationResult } from "../types/bill";

export interface AdminTransactionRecord {
  id: string;
  title: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  currency: string;
  subtotal: number;
  tax: number;
  service: number;
  discount: number;
  grandTotal: number;
  source: "scan" | "manual";
  receiptImageUrl?: string;
  itemCount: number;
  participantCount: number;
  paidCount: number;
  isAllPaid: boolean;
  status: "paid" | "partial" | "pending";
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  participants: Array<{
    id: string;
    name: string;
    paymentStatus?: "paid" | "pending";
    amount: number;
  }>;
  charges: {
    taxRate: number;
    serviceRate: number;
    discountType: "percentage" | "fixed";
    discountValue: number;
    additionalFee: number;
  };
  clientIp?: string;
}

// In-memory store + /tmp file backup for serverless continuity
let memoryStore: Map<string, AdminTransactionRecord> = new Map();
let isInitialized = false;

const TMP_FILE = path.join("/tmp", "smart_bill_admin_transactions.json");

// Initial sample seed transactions to showcase realistic data immediately
const INITIAL_SEEDS: AdminTransactionRecord[] = [
  {
    id: "tx_seed_001",
    title: "Sederhana Padang Bintaro",
    date: new Date(Date.now() - 3600 * 1000 * 2).toISOString().split("T")[0],
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    currency: "IDR",
    subtotal: 185000,
    tax: 18500,
    service: 0,
    discount: 0,
    grandTotal: 203500,
    source: "scan",
    itemCount: 4,
    participantCount: 3,
    paidCount: 3,
    isAllPaid: true,
    status: "paid",
    items: [
      { id: "it1", name: "Rendang Sapi (2x)", quantity: 2, unitPrice: 28000, totalPrice: 56000 },
      { id: "it2", name: "Ayam Pop (2x)", quantity: 2, unitPrice: 26000, totalPrice: 52000 },
      { id: "it3", name: "Gulai Tunjang", quantity: 1, unitPrice: 32000, totalPrice: 32000 },
      { id: "it4", name: "Nasi Putih + Sayur (3x)", quantity: 3, unitPrice: 15000, totalPrice: 45000 },
    ],
    participants: [
      { id: "p1", name: "Budi Santoso", paymentStatus: "paid", amount: 75500 },
      { id: "p2", name: "Siti Rahma", paymentStatus: "paid", amount: 64000 },
      { id: "p3", name: "Andi Wijaya", paymentStatus: "paid", amount: 64000 },
    ],
    charges: {
      taxRate: 10,
      serviceRate: 0,
      discountType: "percentage",
      discountValue: 0,
      additionalFee: 0,
    },
  },
  {
    id: "tx_seed_002",
    title: "Kopi Kenangan Senopati",
    date: new Date(Date.now() - 3600 * 1000 * 8).toISOString().split("T")[0],
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    currency: "IDR",
    subtotal: 92000,
    tax: 9200,
    service: 0,
    discount: 10000,
    grandTotal: 91200,
    source: "manual",
    itemCount: 3,
    participantCount: 4,
    paidCount: 2,
    isAllPaid: false,
    status: "partial",
    items: [
      { id: "it5", name: "Kopi Kenangan Mantan Large (2x)", quantity: 2, unitPrice: 26000, totalPrice: 52000 },
      { id: "it6", name: "Avocado Coffee", quantity: 1, unitPrice: 28000, totalPrice: 28000 },
      { id: "it7", name: "Roti Coklat Klasik", quantity: 1, unitPrice: 12000, totalPrice: 12000 },
    ],
    participants: [
      { id: "p4", name: "Dwi (Host)", paymentStatus: "paid", amount: 25000 },
      { id: "p5", name: "Farhan", paymentStatus: "paid", amount: 25000 },
      { id: "p6", name: "Rina", paymentStatus: "pending", amount: 21200 },
      { id: "p7", name: "Bayu", paymentStatus: "pending", amount: 20000 },
    ],
    charges: {
      taxRate: 10,
      serviceRate: 0,
      discountType: "fixed",
      discountValue: 10000,
      additionalFee: 0,
    },
  },
  {
    id: "tx_seed_003",
    title: "Sushi Tei Grand Indonesia",
    date: new Date(Date.now() - 3600 * 1000 * 26).toISOString().split("T")[0],
    createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    currency: "IDR",
    subtotal: 485000,
    tax: 48500,
    service: 36375,
    discount: 0,
    grandTotal: 569875,
    source: "scan",
    itemCount: 6,
    participantCount: 5,
    paidCount: 0,
    isAllPaid: false,
    status: "pending",
    items: [
      { id: "it8", name: "Salmon Sashimi", quantity: 1, unitPrice: 75000, totalPrice: 75000 },
      { id: "it9", name: "Tuna Salad Crispy Roll", quantity: 1, unitPrice: 65000, totalPrice: 65000 },
      { id: "it10", name: "Chicken Teriyaki Roll (2x)", quantity: 2, unitPrice: 55000, totalPrice: 110000 },
      { id: "it11", name: "Spicy Salmon Maki", quantity: 2, unitPrice: 48000, totalPrice: 96000 },
      { id: "it12", name: "Chawanmushi (3x)", quantity: 3, unitPrice: 28000, totalPrice: 84000 },
      { id: "it13", name: "Ocha Dingin (5x)", quantity: 5, unitPrice: 11000, totalPrice: 55000 },
    ],
    participants: [
      { id: "p8", name: "Irfan", paymentStatus: "pending", amount: 114000 },
      { id: "p9", name: "Dewi", paymentStatus: "pending", amount: 114000 },
      { id: "p10", name: "Rizky", paymentStatus: "pending", amount: 114000 },
      { id: "p11", name: "Nadia", paymentStatus: "pending", amount: 114000 },
      { id: "p12", name: "Hendra", paymentStatus: "pending", amount: 113875 },
    ],
    charges: {
      taxRate: 10,
      serviceRate: 7.5,
      discountType: "percentage",
      discountValue: 0,
      additionalFee: 0,
    },
  },
];

function initStoreIfNeeded() {
  if (isInitialized) return;

  // Try loading from /tmp
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, "utf-8");
      const list: AdminTransactionRecord[] = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        list.forEach((item) => memoryStore.set(item.id, item));
        isInitialized = true;
        return;
      }
    }
  } catch (err) {
    console.warn("Could not read from /tmp transactions file:", err);
  }

  // Load initial seeds if empty
  INITIAL_SEEDS.forEach((item) => memoryStore.set(item.id, item));
  persistToDisk();
  isInitialized = true;
}

function persistToDisk() {
  try {
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(TMP_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    // In some serverless environments /tmp write may fail or be restricted
  }
}

export function getAllTransactions(): AdminTransactionRecord[] {
  initStoreIfNeeded();
  return Array.from(memoryStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTransactionById(id: string): AdminTransactionRecord | null {
  initStoreIfNeeded();
  return memoryStore.get(id) || null;
}

export function upsertTransactionFromBill(
  bill: BillData,
  result?: BillCalculationResult,
  clientIp?: string
): AdminTransactionRecord {
  initStoreIfNeeded();

  const subtotal = bill.items.reduce((acc, it) => acc + (it.totalPrice || it.unitPrice * it.quantity), 0);
  const grandTotal = result ? result.finalGrandTotal : subtotal;

  const paidParticipants = bill.participants.filter(
    (p) => (p as any).paymentStatus === "paid"
  );
  const paidCount = paidParticipants.length;
  const totalCount = bill.participants.length;

  let status: "paid" | "partial" | "pending" = "pending";
  if (totalCount > 0 && paidCount === totalCount) {
    status = "paid";
  } else if (paidCount > 0) {
    status = "partial";
  }

  const existing = memoryStore.get(bill.id);

  const record: AdminTransactionRecord = {
    id: bill.id,
    title: bill.title || "Tagihan Tanpa Judul",
    date: bill.date || new Date().toISOString().split("T")[0],
    createdAt: existing?.createdAt || bill.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currency: bill.currency || "IDR",
    subtotal: result?.subtotal || subtotal,
    tax: result?.taxAmount || 0,
    service: result?.serviceChargeAmount || 0,
    discount: result?.discountAmount || 0,
    grandTotal,
    source: (bill.source as "scan" | "manual") || (bill.receiptImageUrl ? "scan" : "manual"),
    receiptImageUrl: bill.receiptImageUrl,
    itemCount: bill.items.length,
    participantCount: totalCount,
    paidCount,
    isAllPaid: totalCount > 0 && paidCount === totalCount,
    status,
    items: bill.items.map((it) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
    })),
    participants: bill.participants.map((p) => {
      const pCalc = result?.participants.find((c) => c.participantId === p.id);
      return {
        id: p.id,
        name: p.name,
        paymentStatus: (p as any).paymentStatus || (pCalc as any)?.paymentStatus || "pending",
        amount: pCalc?.finalTotal || 0,
      };
    }),
    charges: {
      taxRate: bill.charges?.taxRate || 0,
      serviceRate: bill.charges?.serviceRate || 0,
      discountType: bill.charges?.discountType || "percentage",
      discountValue: bill.charges?.discountValue || 0,
      additionalFee: bill.charges?.additionalFee || 0,
    },
    clientIp,
  };

  memoryStore.set(record.id, record);
  persistToDisk();
  return record;
}

export function deleteTransaction(id: string): boolean {
  initStoreIfNeeded();
  const deleted = memoryStore.delete(id);
  if (deleted) {
    persistToDisk();
  }
  return deleted;
}
