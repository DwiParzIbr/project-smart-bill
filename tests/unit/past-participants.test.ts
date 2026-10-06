import { describe, it, expect } from "vitest";
import { extractPastParticipants, StoredBillRecord } from "@/lib/storage/bill-storage";

describe("Past Participants Reference Helper", () => {
  it("extracts and dedupes participants by frequency and recency", () => {
    const mockBills = [
      {
        id: "1",
        bill: {
          id: "b1",
          title: "Dinner 1",
          date: "2026-10-01",
          currency: "IDR",
          participants: [
            { id: "p1", name: "Budi", displayOrder: 0 },
            { id: "p2", name: "Siti", displayOrder: 1 },
          ],
          items: [],
          charges: {} as any,
          status: "completed",
          createdAt: "2026-10-01T12:00:00Z",
        },
        result: {} as any,
        updatedAt: "2026-10-01T12:00:00Z",
      },
      {
        id: "2",
        bill: {
          id: "b2",
          title: "Dinner 2",
          date: "2026-10-03",
          currency: "IDR",
          participants: [
            { id: "p3", name: "budi", displayOrder: 0 }, // different casing
            { id: "p4", name: "Andi", displayOrder: 1 },
          ],
          items: [],
          charges: {} as any,
          status: "completed",
          createdAt: "2026-10-03T12:00:00Z",
        },
        result: {} as any,
        updatedAt: "2026-10-03T12:00:00Z",
      },
    ] as unknown as StoredBillRecord[];

    const pastList = extractPastParticipants(mockBills);

    // Budi participated 2 times, Siti 1 time, Andi 1 time
    expect(pastList.length).toBe(3);
    expect(pastList[0].name.toLowerCase()).toBe("budi");
    expect(pastList[0].usageCount).toBe(2);

    const names = pastList.map((p) => p.name.toLowerCase());
    expect(names).toContain("siti");
    expect(names).toContain("andi");
  });
});
