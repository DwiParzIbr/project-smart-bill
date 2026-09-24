import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { formatTerbilangRupiah } from "@/lib/utils/terbilang";
import { generateReimbursementCSV } from "@/lib/export/reimbursement-csv-generator";
import { generateReimbursementWorkbook } from "@/lib/export/reimbursement-excel-generator";
import { BillData, BillCalculationResult } from "@/lib/types/bill";

describe("Reimbursement Export & Helpers", () => {
  describe("formatTerbilangRupiah", () => {
    it("converts 0 correctly", () => {
      expect(formatTerbilangRupiah(0)).toBe("Nol Rupiah");
    });

    it("converts simple units and tens", () => {
      expect(formatTerbilangRupiah(5)).toBe("Lima Rupiah");
      expect(formatTerbilangRupiah(11)).toBe("Sebelas Rupiah");
      expect(formatTerbilangRupiah(17)).toBe("Tujuh Belas Rupiah");
      expect(formatTerbilangRupiah(25)).toBe("Dua Puluh Lima Rupiah");
    });

    it("converts hundreds and thousands", () => {
      expect(formatTerbilangRupiah(100)).toBe("Seratus Rupiah");
      expect(formatTerbilangRupiah(150)).toBe("Seratus Lima Puluh Rupiah");
      expect(formatTerbilangRupiah(1000)).toBe("Seribu Rupiah");
      expect(formatTerbilangRupiah(25000)).toBe("Dua Puluh Lima Ribu Rupiah");
      expect(formatTerbilangRupiah(125000)).toBe("Seratus Dua Puluh Lima Ribu Rupiah");
    });

    it("converts millions and billions", () => {
      expect(formatTerbilangRupiah(1500000)).toBe("Satu Juta Lima Ratus Ribu Rupiah");
      expect(formatTerbilangRupiah(2350000000)).toBe("Dua Miliar Tiga Ratus Lima Puluh Juta Rupiah");
    });
  });

  describe("generateReimbursementCSV", () => {
    const mockBill: BillData = {
      id: "bill-claim-12345",
      title: "Makan Siang Tim Project Smart Bill",
      currency: "IDR",
      date: "2026-09-24",
      participants: [
        { id: "p1", name: "Dwi Fariz", displayOrder: 0 },
        { id: "p2", name: "Siti Rahma", displayOrder: 1 },
      ],
      items: [
        {
          id: "item-1",
          name: "Nasi Ayam Bakar, Komplit",
          quantity: 2,
          unitPrice: 35000,
          totalPrice: 70000,
          assignments: [
            { id: "a1", participantId: "p1", shareType: "equal", shareValue: 1 },
            { id: "a2", participantId: "p2", shareType: "equal", shareValue: 1 },
          ],
        },
        {
          id: "item-2",
          name: 'Es Teh "Manis"',
          quantity: 2,
          unitPrice: 8000,
          totalPrice: 16000,
          assignments: [
            { id: "a3", participantId: "p1", shareType: "equal", shareValue: 1 },
            { id: "a4", participantId: "p2", shareType: "equal", shareValue: 1 },
          ],
        },
      ],
      charges: {
        taxRate: 10,
        taxBasis: "after_discount",
        serviceRate: 5,
        serviceBasis: "before_discount",
        discountType: "fixed",
        discountValue: 0,
        additionalFee: 2000,
        roundingStep: 1,
        roundingMode: "nearest",
      },
      status: "completed",
      createdAt: "2026-09-24T10:00:00Z",
      updatedAt: "2026-09-24T10:00:00Z",
    };

    const mockResult: BillCalculationResult = {
      subtotal: 86000,
      discountAmount: 0,
      serviceChargeAmount: 4300,
      taxAmount: 8600,
      additionalFeeAmount: 2000,
      rawGrandTotal: 100900,
      roundingAdjustment: 0,
      finalGrandTotal: 100900,
      participants: [
        {
          participantId: "p1",
          name: "Dwi Fariz",
          itemSubtotal: 43000,
          items: [],
          proportionalDiscount: 0,
          proportionalService: 2150,
          proportionalTax: 4300,
          proportionalAdditionalFee: 1000,
          rawTotal: 50450,
          roundingDiff: 0,
          finalTotal: 50450,
          paymentStatus: "paid",
        },
        {
          participantId: "p2",
          name: "Siti Rahma",
          itemSubtotal: 43000,
          items: [],
          proportionalDiscount: 0,
          proportionalService: 2150,
          proportionalTax: 4300,
          proportionalAdditionalFee: 1000,
          rawTotal: 50450,
          roundingDiff: 0,
          finalTotal: 50450,
          paymentStatus: "pending",
        },
      ],
      isBalanced: true,
      discrepancy: 0,
    };

    it("generates CSV with UTF-8 BOM and correct metadata", () => {
      const csv = generateReimbursementCSV(mockBill, mockResult, {
        companyName: "PT Teknologi Nusantara",
        employeeName: "Dwifi Parizza Ibrahim",
        employeeId: "EMP-2024-001",
        department: "Engineering",
        expenseCategory: "Team Building Lunch",
      });

      // Must start with UTF-8 BOM (\uFEFF)
      expect(csv.startsWith("\uFEFF")).toBe(true);

      // Contains company and employee info
      expect(csv).toContain("PT Teknologi Nusantara");
      expect(csv).toContain("Dwifi Parizza Ibrahim");
      expect(csv).toContain("EMP-2024-001");
      expect(csv).toContain("Engineering");
      expect(csv).toContain("Team Building Lunch");

      // Escapes commas and quotes properly
      expect(csv).toContain('"Nasi Ayam Bakar, Komplit"');
      expect(csv).toContain('"Es Teh ""Manis"""');

      // Contains financial totals
      expect(csv).toContain("100900");
      expect(csv).toContain("Seratus Ribu Sembilan Ratus Rupiah");

      // Contains participants
      expect(csv).toContain("Dwi Fariz");
      expect(csv).toContain("Siti Rahma");
      expect(csv).toContain("50450");
    });
  });

  describe("generateReimbursementWorkbook (Excel .xlsx)", () => {
    const mockBill: BillData = {
      id: "bill-claim-12345",
      title: "Makan Siang Kantor",
      currency: "IDR",
      date: "2026-09-24",
      participants: [
        { id: "p1", name: "Dwifi Parizza", displayOrder: 0 },
        { id: "p2", name: "Reza", displayOrder: 1 },
      ],
      items: [
        {
          id: "item-1",
          name: "Nasi Padang",
          quantity: 2,
          unitPrice: 25000,
          totalPrice: 50000,
          assignments: [
            { id: "a1", participantId: "p1", shareType: "equal", shareValue: 1 },
            { id: "a2", participantId: "p2", shareType: "equal", shareValue: 1 },
          ],
        },
      ],
      charges: {
        taxRate: 10,
        taxBasis: "after_discount",
        serviceRate: 0,
        serviceBasis: "before_discount",
        discountType: "fixed",
        discountValue: 0,
        additionalFee: 0,
        roundingStep: 1,
        roundingMode: "nearest",
      },
      status: "completed",
      createdAt: "2026-09-24T10:00:00Z",
      updatedAt: "2026-09-24T10:00:00Z",
    };

    const mockResult: BillCalculationResult = {
      subtotal: 50000,
      discountAmount: 0,
      serviceChargeAmount: 0,
      taxAmount: 5000,
      additionalFeeAmount: 0,
      rawGrandTotal: 55000,
      roundingAdjustment: 0,
      finalGrandTotal: 55000,
      participants: [
        {
          participantId: "p1",
          name: "Dwifi Parizza",
          itemSubtotal: 25000,
          items: [],
          proportionalDiscount: 0,
          proportionalService: 0,
          proportionalTax: 2500,
          proportionalAdditionalFee: 0,
          rawTotal: 27500,
          roundingDiff: 0,
          finalTotal: 27500,
          paymentStatus: "paid",
        },
        {
          participantId: "p2",
          name: "Reza",
          itemSubtotal: 25000,
          items: [],
          proportionalDiscount: 0,
          proportionalService: 0,
          proportionalTax: 2500,
          proportionalAdditionalFee: 0,
          rawTotal: 27500,
          roundingDiff: 0,
          finalTotal: 27500,
          paymentStatus: "pending",
        },
      ],
      isBalanced: true,
      discrepancy: 0,
    };

    it("creates a valid XLSX workbook with correct sheets and column widths", () => {
      const wb = generateReimbursementWorkbook(mockBill, mockResult, {
        companyName: "PT ASCON INOVASI DATA",
        employeeName: "Dwifi Parizza Ibrahim",
        employeeId: "IT-FARIZ-2026",
        department: "IT",
        expenseCategory: "Makan Siang Tim",
      });

      expect(wb).toBeDefined();
      expect(wb.SheetNames).toContain("Klaim Reimbursement");

      const ws = wb.Sheets["Klaim Reimbursement"];
      expect(ws).toBeDefined();

      // Check column widths
      expect(ws["!cols"]).toBeDefined();
      expect(ws["!cols"]?.length).toBe(6);

      // Verify content
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      const flatText = json.flat().join(" ");

      expect(flatText).toContain("PT ASCON INOVASI DATA");
      expect(flatText).toContain("Dwifi Parizza Ibrahim");
      expect(flatText).toContain("IT-FARIZ-2026");
      expect(flatText).toContain("Nasi Padang");
      expect(flatText).toContain("55000");
      expect(flatText).toContain("Lima Puluh Lima Ribu Rupiah");
      expect(flatText).toContain("Dwifi Parizza");
      expect(flatText).toContain("Reza");
    });
  });
});

