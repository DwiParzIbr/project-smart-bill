import { BillData } from "../types/bill";

export function createDefaultBill(): BillData {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `bill_${Date.now()}`,
    title: "Makan Bersama",
    currency: "IDR",
    date: new Date().toISOString().split("T")[0],
    participants: [
      { id: "p1", name: "Saya", displayOrder: 0 },
      { id: "p2", name: "Teman 1", displayOrder: 1 },
    ],
    items: [],
    charges: {
      taxRate: 10,
      taxBasis: "after_discount",
      serviceRate: 0,
      serviceBasis: "before_discount",
      discountType: "percentage",
      discountValue: 0,
      additionalFee: 0,
      roundingStep: 1,
      roundingMode: "nearest",
    },
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
