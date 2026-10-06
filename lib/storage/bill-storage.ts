import { BillCalculationResult, BillData, HostPaymentProfile } from "../types/bill";
import { getBillTimestamp } from "../utils";

const DB_NAME = "smart_bill_db";
const DB_VERSION = 1;
const DRAFT_KEY = "smart_bill_active_draft";
const STORE_BILLS = "bills";
const PAYMENT_PROFILE_KEY = "smart_bill_payment_profile";

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_BILLS)) {
          db.createObjectStore(STORE_BILLS, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// ----------------- Draft Management -----------------

export async function saveDraft(bill: BillData): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(bill));
  } catch (err) {
    console.error("Failed to save draft to localStorage", err);
  }
}

export async function getDraft(): Promise<BillData | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BillData;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.error("Failed to clear draft", err);
  }
}

// ----------------- Persistent Bills & History -----------------

export interface StoredBillRecord {
  id: string;
  bill: BillData;
  result: BillCalculationResult;
  updatedAt: string;
}

export async function syncBillToServer(
  bill: BillData,
  result?: BillCalculationResult
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/bills/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill, result }),
    });
  } catch {
    // Fail silently in background if offline or network unreachable
  }
}

export async function saveCompletedBill(
  bill: BillData,
  result: BillCalculationResult
): Promise<void> {
  const record: StoredBillRecord = {
    id: bill.id,
    bill,
    result,
    updatedAt: new Date().toISOString(),
  };

  // Sync to server in background so admin can see transaction across devices
  syncBillToServer(bill, result);

  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BILLS, "readwrite");
      tx.objectStore(STORE_BILLS).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  // Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      const list = await getAllBills();
      const existingIdx = list.findIndex((item) => item.id === bill.id);
      if (existingIdx >= 0) {
        list[existingIdx] = record;
      } else {
        list.unshift(record);
      }
      localStorage.setItem("smart_bill_history", JSON.stringify(list));
    } catch (err) {
      console.error("Fallback storage error", err);
    }
  }
}

export async function getAllBills(): Promise<StoredBillRecord[]> {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BILLS, "readonly");
      const store = tx.objectStore(STORE_BILLS);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result as StoredBillRecord[]) || [];
        records.sort((a, b) => {
          const diff = getBillTimestamp(b.bill, b.updatedAt) - getBillTimestamp(a.bill, a.updatedAt);
          if (diff !== 0) return diff;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        resolve(records);
      };
      req.onerror = () => resolve([]);
    });
  }

  // Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("smart_bill_history");
      if (!raw) return [];
      const list = JSON.parse(raw) as StoredBillRecord[];
      list.sort((a, b) => {
        const diff = getBillTimestamp(b.bill, b.updatedAt) - getBillTimestamp(a.bill, a.updatedAt);
        if (diff !== 0) return diff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      return list;
    } catch {
      return [];
    }
  }

  return [];
}

export async function getBillById(id: string): Promise<StoredBillRecord | null> {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BILLS, "readonly");
      const req = tx.objectStore(STORE_BILLS).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  const list = await getAllBills();
  return list.find((b) => b.id === id) || null;
}

export async function deleteBill(id: string): Promise<void> {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BILLS, "readwrite");
      tx.objectStore(STORE_BILLS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  const list = (await getAllBills()).filter((b) => b.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem("smart_bill_history", JSON.stringify(list));
  }
}

export async function clearAllBills(): Promise<void> {
  const db = await openDB();
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_BILLS, "readwrite");
      tx.objectStore(STORE_BILLS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem("smart_bill_history");
  }
}

export async function updatePaymentStatus(
  billId: string,
  participantId: string,
  status: "pending" | "paid"
): Promise<void> {
  const record = await getBillById(billId);
  if (!record) return;

  const p = record.result.participants.find(
    (item) => item.participantId === participantId
  );
  if (p) {
    p.paymentStatus = status;
    p.paidAt = status === "paid" ? new Date().toISOString() : undefined;
  }

  // Check if all are paid
  const allPaid = record.result.participants.every(
    (item) => item.paymentStatus === "paid"
  );
  record.bill.status = allPaid ? "completed" : "calculated";

  await saveCompletedBill(record.bill, record.result);
}

export async function markAllParticipantsPaymentStatus(
  billId: string,
  status: "pending" | "paid"
): Promise<StoredBillRecord | null> {
  const record = await getBillById(billId);
  if (!record) return null;

  const timestamp = status === "paid" ? new Date().toISOString() : undefined;
  record.result.participants.forEach((p) => {
    p.paymentStatus = status;
    p.paidAt = timestamp;
  });

  record.bill.status = status === "paid" ? "completed" : "calculated";
  await saveCompletedBill(record.bill, record.result);
  return record;
}

// ----------------- Host Payment Profile -----------------

export function getHostPaymentProfile(): HostPaymentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PAYMENT_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HostPaymentProfile;
  } catch (err) {
    console.error("Failed to load host payment profile", err);
    return null;
  }
}

export function saveHostPaymentProfile(profile: HostPaymentProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYMENT_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save host payment profile", err);
  }
}

// ----------------- Past Participants Reference -----------------

export interface PastParticipant {
  name: string;
  usageCount: number;
  lastUsed: string;
}

export function extractPastParticipants(bills: StoredBillRecord[]): PastParticipant[] {
  const map = new Map<string, { displayName: string; count: number; lastUsed: string; lastTimestamp: number }>();

  for (const record of bills) {
    const timestamp = getBillTimestamp(record.bill, record.updatedAt);
    const dateStr = record.bill?.date || record.updatedAt || record.bill?.createdAt || new Date().toISOString();
    const participants = record.bill?.participants || [];

    for (const p of participants) {
      const cleanName = (p.name || "").trim();
      if (!cleanName) continue;
      const key = cleanName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (timestamp > existing.lastTimestamp) {
          existing.lastTimestamp = timestamp;
          existing.lastUsed = dateStr;
          existing.displayName = cleanName; // Use most recent casing
        }
      } else {
        map.set(key, {
          displayName: cleanName,
          count: 1,
          lastUsed: dateStr,
          lastTimestamp: timestamp,
        });
      }
    }
  }

  const list: PastParticipant[] = Array.from(map.values()).map((item) => ({
    name: item.displayName,
    usageCount: item.count,
    lastUsed: item.lastUsed,
  }));

  // Sort by usageCount descending (most frequent first), then by recency descending
  list.sort((a, b) => {
    if (b.usageCount !== a.usageCount) {
      return b.usageCount - a.usageCount;
    }
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
  });

  return list;
}

export async function getPastParticipants(): Promise<PastParticipant[]> {
  const bills = await getAllBills();
  return extractPastParticipants(bills);
}

