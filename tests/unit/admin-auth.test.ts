import { describe, it, expect } from "vitest";
import {
  validateAdminCredentials,
  generateAdminToken,
  verifyAdminToken,
} from "@/lib/admin/auth";
import {
  getAllTransactions,
  upsertTransactionFromBill,
  deleteTransaction,
} from "@/lib/server/transaction-store";
import { createDefaultBill } from "@/lib/storage/default-bill";

describe("Admin Authentication", () => {
  it("validates default admin credentials correctly", () => {
    expect(validateAdminCredentials("admin", "admin123")).toBe(true);
    expect(validateAdminCredentials("admin", "wrongpass")).toBe(false);
    expect(validateAdminCredentials("wronguser", "admin123")).toBe(false);
    expect(validateAdminCredentials(" admin ", " admin123 ")).toBe(true);
  });

  it("generates and verifies HMAC admin tokens", () => {
    const token = generateAdminToken("admin");
    expect(typeof token).toBe("string");
    expect(token).toContain(".");

    const result = verifyAdminToken(token);
    expect(result.isValid).toBe(true);
    expect(result.username).toBe("admin");
  });

  it("rejects tampered or malformed tokens", () => {
    expect(verifyAdminToken("invalid.token")).toEqual({ isValid: false });
    expect(verifyAdminToken(null)).toEqual({ isValid: false });
    expect(verifyAdminToken(undefined)).toEqual({ isValid: false });
    expect(verifyAdminToken("")).toEqual({ isValid: false });

    // Tampered token
    const token = generateAdminToken("admin");
    const [payload] = token.split(".");
    const forgedToken = `${payload}.forgedhmac123`;
    expect(verifyAdminToken(forgedToken)).toEqual({ isValid: false });
  });
});

describe("Admin Transaction Store", () => {
  it("initializes and returns transaction records", () => {
    const txs = getAllTransactions();
    expect(Array.isArray(txs)).toBe(true);
    expect(txs.length).toBeGreaterThan(0);
  });

  it("upserts and deletes transactions correctly", () => {
    const bill = createDefaultBill();
    bill.id = `test_bill_${Date.now()}`;
    bill.title = "Test Resto Makan";
    bill.items = [
      {
        id: "item_test_1",
        name: "Nasi Goreng Spesial",
        quantity: 2,
        unitPrice: 25000,
        totalPrice: 50000,
        assignments: [],
      },
    ];

    const record = upsertTransactionFromBill(bill);
    expect(record.id).toBe(bill.id);
    expect(record.title).toBe("Test Resto Makan");
    expect(record.grandTotal).toBe(50000);

    const deleted = deleteTransaction(bill.id);
    expect(deleted).toBe(true);
  });
});
