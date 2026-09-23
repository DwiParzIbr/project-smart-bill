import { describe, it, expect } from "vitest";
import { calculateBill, calculateItemAllocations, applyRounding } from "@/lib/calculation/engine";
import { BillCharges, BillItem, Participant } from "@/lib/types/bill";

describe("Calculation Engine", () => {
  const defaultCharges: BillCharges = {
    taxRate: 10,
    taxBasis: "after_discount",
    serviceRate: 5,
    serviceBasis: "before_discount",
    discountType: "percentage",
    discountValue: 0,
    additionalFee: 0,
    roundingStep: 1,
    roundingMode: "nearest",
  };

  it("calculates simple 1 person bill correctly", () => {
    const participants: Participant[] = [{ id: "p1", name: "Fariz", displayOrder: 0 }];
    const items: BillItem[] = [
      {
        id: "i1",
        name: "Nasi Goreng",
        quantity: 2,
        unitPrice: 25000,
        totalPrice: 50000,
        assignments: [
          { id: "a1", participantId: "p1", shareType: "equal", shareValue: 1 },
        ],
      },
    ];

    const result = calculateBill(participants, items, { ...defaultCharges, taxRate: 10, serviceRate: 0 });

    expect(result.subtotal).toBe(50000);
    expect(result.taxAmount).toBe(5000);
    expect(result.finalGrandTotal).toBe(55000);
    expect(result.isBalanced).toBe(true);
    expect(result.participants[0].finalTotal).toBe(55000);
  });

  it("splits shared item equally with remainder distribution without losing cents", () => {
    // Rp 50.000 split across 3 people = 16.667 + 16.667 + 16.666 = 50.000
    const allocations = calculateItemAllocations(50000, [
      { id: "a1", participantId: "p1", shareType: "equal", shareValue: 1 },
      { id: "a2", participantId: "p2", shareType: "equal", shareValue: 1 },
      { id: "a3", participantId: "p3", shareType: "equal", shareValue: 1 },
    ]);

    expect(allocations).toHaveLength(3);
    const sum = allocations.reduce((acc, curr) => acc + curr.amount, 0);
    expect(sum).toBe(50000);
    expect(allocations[0].amount).toBe(16667);
    expect(allocations[1].amount).toBe(16667);
    expect(allocations[2].amount).toBe(16666);
  });

  it("calculates percentage split accurately", () => {
    // 50%, 30%, 20% on Rp 100.000
    const allocations = calculateItemAllocations(100000, [
      { id: "a1", participantId: "p1", shareType: "percentage", shareValue: 50 },
      { id: "a2", participantId: "p2", shareType: "percentage", shareValue: 30 },
      { id: "a3", participantId: "p3", shareType: "percentage", shareValue: 20 },
    ]);

    expect(allocations[0].amount).toBe(50000);
    expect(allocations[1].amount).toBe(30000);
    expect(allocations[2].amount).toBe(20000);
    expect(allocations.reduce((acc, c) => acc + c.amount, 0)).toBe(100000);
  });

  it("calculates fixed amount split", () => {
    const allocations = calculateItemAllocations(30000, [
      { id: "a1", participantId: "p1", shareType: "fixed", shareValue: 15000 },
      { id: "a2", participantId: "p2", shareType: "fixed", shareValue: 10000 },
      { id: "a3", participantId: "p3", shareType: "fixed", shareValue: 5000 },
    ]);

    expect(allocations[0].amount).toBe(15000);
    expect(allocations[1].amount).toBe(10000);
    expect(allocations[2].amount).toBe(5000);
  });

  it("distributes tax, service, and discount proportionally to 2 people with different orders", () => {
    const participants: Participant[] = [
      { id: "p1", name: "Fariz", displayOrder: 0 },
      { id: "p2", name: "Andi", displayOrder: 1 },
    ];

    // Fariz orders Rp 60.000 (60%), Andi orders Rp 40.000 (40%)
    const items: BillItem[] = [
      {
        id: "i1",
        name: "Steak",
        quantity: 1,
        unitPrice: 60000,
        totalPrice: 60000,
        assignments: [{ id: "a1", participantId: "p1", shareType: "equal", shareValue: 1 }],
      },
      {
        id: "i2",
        name: "Burger",
        quantity: 1,
        unitPrice: 40000,
        totalPrice: 40000,
        assignments: [{ id: "a2", participantId: "p2", shareType: "equal", shareValue: 1 }],
      },
    ];

    // 10% discount, 10% tax, 5% service
    const charges: BillCharges = {
      taxRate: 10,
      taxBasis: "after_discount", // Tax on (100k - 10k) = 90k -> 9k tax
      serviceRate: 5,
      serviceBasis: "before_discount", // Service on 100k -> 5k service
      discountType: "percentage",
      discountValue: 10, // 10k discount
      additionalFee: 2000, // 2k parking
      roundingStep: 1,
      roundingMode: "nearest",
    };

    const res = calculateBill(participants, items, charges);

    expect(res.subtotal).toBe(100000);
    expect(res.discountAmount).toBe(10000);
    expect(res.serviceChargeAmount).toBe(5000);
    expect(res.taxAmount).toBe(9000);
    expect(res.additionalFeeAmount).toBe(2000);

    // Total: 100k - 10k + 5k + 9k + 2k = 106.000
    expect(res.finalGrandTotal).toBe(106000);
    expect(res.isBalanced).toBe(true);

    // Fariz share (60%):
    // Subtotal: 60.000
    // Discount: 6.000
    // Service: 3.000
    // Tax: 5.400
    // Fee: 1.200
    // Total: 60 - 6 + 3 + 5.4 + 1.2 = 63.600
    const fariz = res.participants.find((p) => p.participantId === "p1")!;
    expect(fariz.finalTotal).toBe(63600);

    // Andi share (40%):
    // 40 - 4 + 2 + 3.6 + 0.8 = 42.400
    const andi = res.participants.find((p) => p.participantId === "p2")!;
    expect(andi.finalTotal).toBe(42400);

    expect(fariz.finalTotal + andi.finalTotal).toBe(106000);
  });

  it("handles rounding correctly (nearest 100 and up 500)", () => {
    const round100 = applyRounding(12345, 100, "nearest");
    expect(round100.rounded).toBe(12300);

    const roundUp500 = applyRounding(12345, 500, "up");
    expect(roundUp500.rounded).toBe(12500);

    const roundDown1000 = applyRounding(12800, 1000, "down");
    expect(roundDown1000.rounded).toBe(12000);
  });

  it("handles 10 people bill with zero discrepancy", () => {
    const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Person ${i + 1}`,
      displayOrder: i,
    }));

    // Everyone shares a grand feast of Rp 357.850 equally
    const items: BillItem[] = [
      {
        id: "feast",
        name: "Feast",
        quantity: 1,
        unitPrice: 357850,
        totalPrice: 357850,
        assignments: participants.map((p, i) => ({
          id: `a${i}`,
          participantId: p.id,
          shareType: "equal",
          shareValue: 1,
        })),
      },
    ];

    const charges: BillCharges = {
      ...defaultCharges,
      taxRate: 11, // PPN 11%
      serviceRate: 7,
      discountType: "fixed",
      discountValue: 25000,
      additionalFee: 5000,
      roundingStep: 100,
      roundingMode: "nearest",
    };

    const res = calculateBill(participants, items, charges);
    expect(res.isBalanced).toBe(true);
    expect(res.discrepancy).toBe(0);

    const sum = res.participants.reduce((acc, p) => acc + p.finalTotal, 0);
    expect(sum).toBe(res.finalGrandTotal);
  });
});
