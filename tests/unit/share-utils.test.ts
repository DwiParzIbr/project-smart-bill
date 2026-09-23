import { describe, it, expect } from "vitest";
import {
  formatWhatsAppPhone,
  buildWhatsAppUrl,
  generatePersonalWhatsAppMessage,
  generateWhatsAppSummary,
} from "@/lib/sharing/share-utils";
import {
  BillData,
  BillCalculationResult,
  ParticipantCalculation,
  HostPaymentProfile,
} from "@/lib/types/bill";

describe("Share Utils", () => {
  describe("formatWhatsAppPhone", () => {
    it("formats 08xx Indonesian numbers to 628xx", () => {
      expect(formatWhatsAppPhone("081234567890")).toBe("6281234567890");
      expect(formatWhatsAppPhone("0857-1234-5678")).toBe("6285712345678");
    });

    it("handles numbers already starting with 62 or +62", () => {
      expect(formatWhatsAppPhone("+6281234567890")).toBe("6281234567890");
      expect(formatWhatsAppPhone("6281234567890")).toBe("6281234567890");
    });

    it("returns empty string if input is empty", () => {
      expect(formatWhatsAppPhone("")).toBe("");
      expect(formatWhatsAppPhone(undefined)).toBe("");
    });
  });

  describe("buildWhatsAppUrl", () => {
    it("generates wa.me url with phone number and encoded text", () => {
      const url = buildWhatsAppUrl("081234567890", "Halo Budi");
      expect(url).toBe("https://wa.me/6281234567890?text=Halo%20Budi");
    });

    it("generates generic wa.me share url when phone is omitted", () => {
      const url = buildWhatsAppUrl("", "Halo Teman-teman");
      expect(url).toBe("https://wa.me/?text=Halo%20Teman-teman");
    });
  });

  describe("generatePersonalWhatsAppMessage", () => {
    const mockBill: BillData = {
      id: "bill-1",
      title: "Makan Siang Bareng",
      currency: "IDR",
      date: "2026-09-23",
      participants: [{ id: "p1", name: "Budi", displayOrder: 0 }],
      items: [],
      charges: {
        taxRate: 10,
        taxBasis: "after_discount",
        serviceRate: 0,
        serviceBasis: "after_discount",
        discountType: "fixed",
        discountValue: 0,
        additionalFee: 0,
        roundingStep: 1,
        roundingMode: "nearest",
      },
      status: "calculated",
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
    };

    const mockParticipant: ParticipantCalculation = {
      participantId: "p1",
      name: "Budi",
      itemSubtotal: 35000,
      items: [
        {
          itemId: "it-1",
          itemName: "Nasi Ayam Geprek",
          shareType: "equal",
          shareValue: 1,
          allocatedAmount: 25000,
        },
        {
          itemId: "it-2",
          itemName: "Es Teh Manis",
          shareType: "equal",
          shareValue: 1,
          allocatedAmount: 10000,
        },
      ],
      proportionalDiscount: 0,
      proportionalService: 0,
      proportionalTax: 3500,
      proportionalAdditionalFee: 0,
      rawTotal: 38500,
      roundingDiff: 0,
      finalTotal: 38500,
      paymentStatus: "pending",
    };

    const mockProfile: HostPaymentProfile = {
      hostName: "Dwi Fariz",
      accounts: [
        {
          id: "acc-1",
          provider: "BCA",
          accountNumber: "1234567890",
          accountHolder: "Dwi Fariz",
        },
        {
          id: "acc-2",
          provider: "GoPay",
          accountNumber: "08123456789",
          accountHolder: "Dwi Fariz",
        },
      ],
      qrisImageUrl: "data:image/png;base64,sampleqris",
      customNotes: "Sertakan nama pengirim",
    };

    it("generates tailored Indonesian message with items, tax, and host accounts", () => {
      const msg = generatePersonalWhatsAppMessage(mockBill, mockParticipant, mockProfile);

      expect(msg).toContain("Hai *Budi*!");
      expect(msg).toContain("Makan Siang Bareng");
      expect(msg).toContain("Nasi Ayam Geprek: Rp25.000");
      expect(msg).toContain("Es Teh Manis: Rp10.000");
      expect(msg).toContain("Pajak/Layanan/Diskon: +Rp3.500");
      expect(msg).toContain("Total bagianmu: Rp38.500");
      expect(msg).toContain("BCA: *1234567890* (a.n Dwi Fariz)");
      expect(msg).toContain("GoPay: *08123456789* (a.n Dwi Fariz)");
      expect(msg).toContain("Sertakan nama pengirim");
    });
  });
});
