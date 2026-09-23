export type ShareType = "equal" | "percentage" | "fixed";

export interface Participant {
  id: string;
  name: string;
  displayOrder: number;
}

export interface ItemAssignment {
  id: string;
  participantId: string;
  shareType: ShareType;
  shareValue: number; // For equal: 1; for percentage: 0-100; for fixed: nominal
  allocatedAmount?: number; // Calculated amount in lowest currency unit (e.g. Rupiah)
}

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number; // in lowest currency unit (integer)
  totalPrice: number; // quantity * unitPrice
  assignments: ItemAssignment[];
}

export type TaxBasis = "after_discount" | "before_discount" | "custom";
export type ServiceBasis = "before_discount" | "after_discount" | "custom";
export type RoundingStep = 1 | 100 | 500 | 1000;
export type RoundingMode = "nearest" | "up" | "down";

export interface BillCharges {
  taxRate: number; // percentage, e.g. 10 for 10%
  taxBasis: TaxBasis;
  customTaxBase?: number;

  serviceRate: number; // percentage, e.g. 5 for 5%
  serviceBasis: ServiceBasis;
  customServiceBase?: number;

  discountType: "percentage" | "fixed";
  discountValue: number; // percentage (0-100) or nominal amount

  additionalFee: number; // e.g. parking, take-away box, etc.
  
  roundingStep: RoundingStep;
  roundingMode: RoundingMode;
}

export interface BillData {
  id: string;
  title: string;
  currency: string;
  date: string;
  participants: Participant[];
  items: BillItem[];
  charges: BillCharges;
  status: "draft" | "calculated" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantCalculation {
  participantId: string;
  name: string;
  itemSubtotal: number;
  items: {
    itemId: string;
    itemName: string;
    shareType: ShareType;
    shareValue: number;
    allocatedAmount: number;
  }[];
  proportionalDiscount: number;
  proportionalService: number;
  proportionalTax: number;
  proportionalAdditionalFee: number;
  rawTotal: number;
  roundingDiff: number;
  finalTotal: number;
  paymentStatus: "pending" | "paid";
  paidAt?: string;
}

export interface BillCalculationResult {
  subtotal: number;
  discountAmount: number;
  serviceChargeAmount: number;
  taxAmount: number;
  additionalFeeAmount: number;
  rawGrandTotal: number;
  roundingAdjustment: number;
  finalGrandTotal: number;
  participants: ParticipantCalculation[];
  isBalanced: boolean;
  discrepancy: number; // Should be 0 when balanced
}
