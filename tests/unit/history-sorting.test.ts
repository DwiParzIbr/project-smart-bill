import { describe, it, expect } from "vitest";
import { getBillTimestamp, formatDateIndonesian } from "@/lib/utils";
import { StoredBillRecord } from "@/lib/storage/bill-storage";

describe("History Sorting & Date Utilities", () => {
  it("extracts timestamp correctly from bill.date", () => {
    const bill = { date: "2026-10-05" };
    const ts = getBillTimestamp(bill);
    expect(ts).toBe(new Date("2026-10-05").getTime());
  });

  it("falls back to createdAt or updatedAt when bill.date is missing or invalid", () => {
    const billWithoutDate = { date: "", createdAt: "2026-09-01T10:00:00Z" };
    expect(getBillTimestamp(billWithoutDate)).toBe(new Date("2026-09-01T10:00:00Z").getTime());

    const billFallback = { date: "" };
    expect(getBillTimestamp(billFallback, "2026-08-15T08:00:00Z")).toBe(new Date("2026-08-15T08:00:00Z").getTime());
  });

  it("formats dates to Indonesian format", () => {
    const formatted = formatDateIndonesian("2026-10-05");
    expect(formatted).toMatch(/5 Okt 2026|5 Oct 2026/); // handles locale gracefully
    expect(formatDateIndonesian(undefined)).toBe("-");
  });

  it("correctly sorts mock bills by newest date first", () => {
    const mockList = [
      { id: "1", bill: { title: "A", date: "2026-08-01" }, updatedAt: "2026-08-01T00:00:00Z" },
      { id: "2", bill: { title: "B", date: "2026-10-05" }, updatedAt: "2026-10-05T00:00:00Z" },
      { id: "3", bill: { title: "C", date: "2026-09-15" }, updatedAt: "2026-09-15T00:00:00Z" },
    ] as unknown as StoredBillRecord[];

    const sortedNewest = [...mockList].sort((a, b) => {
      return getBillTimestamp(b.bill, b.updatedAt) - getBillTimestamp(a.bill, a.updatedAt);
    });

    expect(sortedNewest.map((b) => b.id)).toEqual(["2", "3", "1"]);

    const sortedOldest = [...mockList].sort((a, b) => {
      return getBillTimestamp(a.bill, a.updatedAt) - getBillTimestamp(b.bill, b.updatedAt);
    });

    expect(sortedOldest.map((b) => b.id)).toEqual(["1", "3", "2"]);
  });
});
