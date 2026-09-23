import { describe, it, expect } from "vitest";
import { calculateDebtSettlements } from "@/lib/calculation/engine";
import {
  Participant,
  BillPayer,
  ParticipantCalculation,
} from "@/lib/types/bill";

describe("Debt Simplification (Multi-Payer)", () => {
  const pA: Participant = { id: "pA", name: "Budi", displayOrder: 0 };
  const pB: Participant = { id: "pB", name: "Siti", displayOrder: 1 };
  const pC: Participant = { id: "pC", name: "Agus", displayOrder: 2 };
  const pD: Participant = { id: "pD", name: "Dina", displayOrder: 3 };

  const createCalc = (id: string, name: string, finalTotal: number): ParticipantCalculation => ({
    participantId: id,
    name,
    itemSubtotal: finalTotal,
    items: [],
    proportionalDiscount: 0,
    proportionalService: 0,
    proportionalTax: 0,
    proportionalAdditionalFee: 0,
    rawTotal: finalTotal,
    roundingDiff: 0,
    finalTotal,
    paymentStatus: "pending",
  });

  it("handles single-payer default correctly: non-payers transfer directly to payer", () => {
    const participants = [pA, pB, pC];
    // Each person consumed 50.000, Total = 150.000
    const calcs = [
      createCalc("pA", "Budi", 50000),
      createCalc("pB", "Siti", 50000),
      createCalc("pC", "Agus", 50000),
    ];

    // When payers is undefined, Budi (first participant) is the sole payer of 150.000
    const settlements = calculateDebtSettlements(participants, undefined, calcs);

    expect(settlements).toHaveLength(2);
    // Siti owes Budi 50.000
    expect(settlements).toContainEqual({
      fromParticipantId: "pB",
      fromName: "Siti",
      toParticipantId: "pA",
      toName: "Budi",
      amount: 50000,
    });
    // Agus owes Budi 50.000
    expect(settlements).toContainEqual({
      fromParticipantId: "pC",
      fromName: "Agus",
      toParticipantId: "pA",
      toName: "Budi",
      amount: 50000,
    });
  });

  it("simplifies transactions with two payers (Budi paid 200k, Siti paid 80k)", () => {
    const participants = [pA, pB, pC, pD];
    // Total = 280.000
    // Budi consumed 70.000
    // Siti consumed 70.000
    // Agus consumed 70.000
    // Dina consumed 70.000
    const calcs = [
      createCalc("pA", "Budi", 70000),
      createCalc("pB", "Siti", 70000),
      createCalc("pC", "Agus", 70000),
      createCalc("pD", "Dina", 70000),
    ];

    // Upfront: Budi paid 200.000 (net +130.000)
    // Siti paid 80.000 (net +10.000)
    // Agus paid 0 (net -70.000)
    // Dina paid 0 (net -70.000)
    const payers: BillPayer[] = [
      { participantId: "pA", amount: 200000 },
      { participantId: "pB", amount: 80000 },
    ];

    const settlements = calculateDebtSettlements(participants, payers, calcs);

    // Total settlements should sum to 140.000 (70k + 70k)
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalSettled).toBe(140000);

    // Budi should receive 130.000 in total
    const budiReceived = settlements
      .filter((s) => s.toParticipantId === "pA")
      .reduce((sum, s) => sum + s.amount, 0);
    expect(budiReceived).toBe(130000);

    // Siti should receive 10.000 in total
    const sitiReceived = settlements
      .filter((s) => s.toParticipantId === "pB")
      .reduce((sum, s) => sum + s.amount, 0);
    expect(sitiReceived).toBe(10000);

    // Max transactions needed <= 3
    expect(settlements.length).toBeLessThanOrEqual(3);
  });

  it("produces 0 transactions when everyone paid their exact share", () => {
    const participants = [pA, pB];
    const calcs = [
      createCalc("pA", "Budi", 50000),
      createCalc("pB", "Siti", 50000),
    ];
    const payers: BillPayer[] = [
      { participantId: "pA", amount: 50000 },
      { participantId: "pB", amount: 50000 },
    ];

    const settlements = calculateDebtSettlements(participants, payers, calcs);
    expect(settlements).toHaveLength(0);
  });
});
