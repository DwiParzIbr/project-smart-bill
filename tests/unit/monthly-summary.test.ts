import { describe, it, expect } from "vitest";
import {
  getMonthKeyFromDate,
  formatMonthLabel,
  groupBillsByMonth,
  generateMonthlyReportText,
} from "@/lib/reports/monthly-summary";
import { StoredBillRecord } from "@/lib/storage/bill-storage";

describe("Monthly Summary Report Helpers", () => {
  it("extracts month key and formats label accurately", () => {
    expect(getMonthKeyFromDate("2026-10-05")).toBe("2026-10");
    expect(getMonthKeyFromDate("2026-01-20T12:00:00Z")).toBe("2026-01");
    expect(formatMonthLabel("2026-10")).toBe("Oktober 2026");
    expect(formatMonthLabel("2026-01")).toBe("Januari 2026");
  });

  it("groups bills by month and aggregates totals, participants, and status", () => {
    const mockBills = [
      {
        id: "1",
        bill: {
          title: "Lunch Solaria",
          date: "2026-10-02",
          currency: "IDR",
          participants: [{ name: "Budi" }, { name: "Siti" }],
        },
        result: {
          finalGrandTotal: 100000,
          participants: [
            { participantId: "p1", paymentStatus: "paid" },
            { participantId: "p2", paymentStatus: "paid" },
          ],
        },
      },
      {
        id: "2",
        bill: {
          title: "Dinner Kintan",
          date: "2026-10-15",
          currency: "IDR",
          participants: [{ name: "Budi" }, { name: "Andi" }],
        },
        result: {
          finalGrandTotal: 200000,
          participants: [
            { participantId: "p1", paymentStatus: "paid" },
            { participantId: "p3", paymentStatus: "pending" },
          ],
        },
      },
      {
        id: "3",
        bill: {
          title: "Coffee Break",
          date: "2026-09-20",
          currency: "IDR",
          participants: [{ name: "Eko" }],
        },
        result: {
          finalGrandTotal: 50000,
          participants: [{ participantId: "p4", paymentStatus: "paid" }],
        },
      },
    ] as unknown as StoredBillRecord[];

    const summaries = groupBillsByMonth(mockBills);

    expect(summaries.length).toBe(2);

    // Latest month first (2026-10)
    const oct = summaries[0];
    expect(oct.monthKey).toBe("2026-10");
    expect(oct.monthLabel).toBe("Oktober 2026");
    expect(oct.totalAmount).toBe(300000);
    expect(oct.totalBills).toBe(2);
    expect(oct.paidBills).toBe(1);
    expect(oct.unpaidBills).toBe(1);
    expect(oct.averagePerBill).toBe(150000);
    expect(oct.uniqueParticipants.length).toBe(3); // Budi, Siti, Andi

    // September (2026-09)
    const sep = summaries[1];
    expect(sep.monthKey).toBe("2026-09");
    expect(sep.totalAmount).toBe(50000);
    expect(sep.totalBills).toBe(1);
    expect(sep.paidBills).toBe(1);
  });

  it("generates formatted WhatsApp text summary", () => {
    const mockSummary = {
      monthKey: "2026-10",
      monthLabel: "Oktober 2026",
      year: 2026,
      month: 10,
      totalAmount: 100000,
      totalBills: 1,
      paidBills: 1,
      unpaidBills: 0,
      totalPeople: 2,
      uniqueParticipants: ["budi", "siti"],
      averagePerBill: 100000,
      bills: [
        {
          id: "1",
          bill: {
            title: "Solaria",
            date: "2026-10-02",
            currency: "IDR",
            participants: [{ name: "Budi" }, { name: "Siti" }],
          },
          result: {
            finalGrandTotal: 100000,
            participants: [
              { paymentStatus: "paid" },
              { paymentStatus: "paid" },
            ],
          },
        },
      ],
    } as any;

    const text = generateMonthlyReportText(mockSummary);
    expect(text).toContain("REKAP TAGIHAN SMART BILL");
    expect(text).toContain("Oktober 2026");
    expect(text).toContain("Rp100.000");
    expect(text).toContain("Solaria");
  });
});
