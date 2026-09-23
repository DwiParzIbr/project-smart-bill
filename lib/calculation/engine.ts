import {
  BillCharges,
  BillCalculationResult,
  BillItem,
  ItemAssignment,
  Participant,
  ParticipantCalculation,
  RoundingMode,
  RoundingStep,
} from "../types/bill";

/**
 * Calculates allocation of an item's cost to participants.
 * Guarantees that the sum of allocated amounts equals the item total.
 */
export function calculateItemAllocations(
  itemTotal: number,
  assignments: ItemAssignment[]
): { participantId: string; amount: number }[] {
  if (!assignments || assignments.length === 0) {
    return [];
  }

  const shareType = assignments[0].shareType;

  if (shareType === "equal") {
    const count = assignments.length;
    const base = Math.floor(itemTotal / count);
    const remainder = itemTotal % count;

    return assignments.map((assignment, index) => ({
      participantId: assignment.participantId,
      // Distribute remainder unit-by-unit so total matches 100%
      amount: base + (index < remainder ? 1 : 0),
    }));
  }

  if (shareType === "percentage") {
    let totalAssigned = 0;
    const results = assignments.map((a, idx) => {
      if (idx === assignments.length - 1) {
        // Last one takes exact remainder to ensure 0 drift
        const finalAmt = Math.max(0, itemTotal - totalAssigned);
        return { participantId: a.participantId, amount: finalAmt };
      }
      const amt = Math.round((itemTotal * a.shareValue) / 100);
      totalAssigned += amt;
      return { participantId: a.participantId, amount: amt };
    });
    return results;
  }

  if (shareType === "fixed") {
    return assignments.map((a) => ({
      participantId: a.participantId,
      amount: Math.round(a.shareValue),
    }));
  }

  return [];
}

/**
 * Applies rounding according to chosen step (1, 100, 500, 1000) and mode.
 */
export function applyRounding(
  amount: number,
  step: RoundingStep = 1,
  mode: RoundingMode = "nearest"
): { rounded: number; diff: number } {
  if (step <= 1) {
    const rounded = Math.round(amount);
    return { rounded, diff: 0 };
  }

  let rounded = amount;
  if (mode === "nearest") {
    rounded = Math.round(amount / step) * step;
  } else if (mode === "up") {
    rounded = Math.ceil(amount / step) * step;
  } else if (mode === "down") {
    rounded = Math.floor(amount / step) * step;
  }

  return {
    rounded,
    diff: rounded - amount,
  };
}

/**
 * Distributes a group charge or discount proportionally across participants
 * while guaranteeing the sum of distributed parts matches the target total exactly.
 */
function distributeProportionally(
  targetTotal: number,
  participantSubtotals: { id: string; subtotal: number }[],
  overallSubtotal: number
): Map<string, number> {
  const distribution = new Map<string, number>();

  if (targetTotal === 0 || participantSubtotals.length === 0) {
    participantSubtotals.forEach((p) => distribution.set(p.id, 0));
    return distribution;
  }

  if (overallSubtotal <= 0) {
    // Equal distribution if no item subtotals
    const count = participantSubtotals.length;
    const base = Math.floor(targetTotal / count);
    const remainder = targetTotal % count;
    participantSubtotals.forEach((p, idx) => {
      distribution.set(p.id, base + (idx < remainder ? 1 : 0));
    });
    return distribution;
  }

  let distributedSum = 0;
  participantSubtotals.forEach((p, idx) => {
    if (idx === participantSubtotals.length - 1) {
      // Last participant absorbs remainder to guarantee zero discrepancy
      distribution.set(p.id, targetTotal - distributedSum);
    } else {
      const share = Math.round((p.subtotal / overallSubtotal) * targetTotal);
      distributedSum += share;
      distribution.set(p.id, share);
    }
  });

  return distribution;
}

/**
 * Main Calculation Engine
 * Calculates full breakdown: subtotals, shared items, discounts, services, taxes,
 * individual totals, and rounding adjustments.
 */
export function calculateBill(
  participants: Participant[],
  items: BillItem[],
  charges: BillCharges
): BillCalculationResult {
  // 1. Calculate items subtotal and per-participant allocations
  let subtotal = 0;
  const participantItemMap = new Map<
    string,
    {
      subtotal: number;
      items: {
        itemId: string;
        itemName: string;
        shareType: any;
        shareValue: number;
        allocatedAmount: number;
      }[];
    }
  >();

  participants.forEach((p) => {
    participantItemMap.set(p.id, { subtotal: 0, items: [] });
  });

  items.forEach((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;

    const allocations = calculateItemAllocations(itemTotal, item.assignments);
    allocations.forEach((alloc) => {
      const pData = participantItemMap.get(alloc.participantId);
      if (pData) {
        pData.subtotal += alloc.amount;
        const assignment = item.assignments.find(
          (a) => a.participantId === alloc.participantId
        );
        pData.items.push({
          itemId: item.id,
          itemName: item.name,
          shareType: assignment?.shareType || "equal",
          shareValue: assignment?.shareValue || 1,
          allocatedAmount: alloc.amount,
        });
      }
    });
  });

  // 2. Calculate Discount
  let discountAmount = 0;
  if (charges.discountType === "percentage") {
    discountAmount = Math.round((subtotal * Math.max(0, charges.discountValue)) / 100);
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, Math.round(charges.discountValue)));
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // 3. Calculate Service Charge
  let serviceBase = subtotal;
  if (charges.serviceBasis === "after_discount") {
    serviceBase = subtotalAfterDiscount;
  } else if (charges.serviceBasis === "custom" && charges.customServiceBase !== undefined) {
    serviceBase = charges.customServiceBase;
  }
  const serviceChargeAmount = Math.round((serviceBase * Math.max(0, charges.serviceRate)) / 100);

  // 4. Calculate Tax
  let taxBase = subtotalAfterDiscount;
  if (charges.taxBasis === "before_discount") {
    taxBase = subtotal;
  } else if (charges.taxBasis === "custom" && charges.customTaxBase !== undefined) {
    taxBase = charges.customTaxBase;
  }
  const taxAmount = Math.round((taxBase * Math.max(0, charges.taxRate)) / 100);

  // 5. Additional Fee
  const additionalFeeAmount = Math.max(0, Math.round(charges.additionalFee || 0));

  // 6. Distribute fees & discounts proportionally among participants
  const participantSubtotalList = participants.map((p) => ({
    id: p.id,
    subtotal: participantItemMap.get(p.id)?.subtotal || 0,
  }));

  const discountDist = distributeProportionally(
    discountAmount,
    participantSubtotalList,
    subtotal
  );
  const serviceDist = distributeProportionally(
    serviceChargeAmount,
    participantSubtotalList,
    subtotal
  );
  const taxDist = distributeProportionally(
    taxAmount,
    participantSubtotalList,
    subtotal
  );
  const feeDist = distributeProportionally(
    additionalFeeAmount,
    participantSubtotalList,
    subtotal
  );

  // 7. Calculate each participant's raw total & rounded total
  let sumParticipantRaw = 0;
  let sumParticipantRounded = 0;

  const participantResults: ParticipantCalculation[] = participants.map((p) => {
    const pData = participantItemMap.get(p.id) || { subtotal: 0, items: [] };
    const pDiscount = discountDist.get(p.id) || 0;
    const pService = serviceDist.get(p.id) || 0;
    const pTax = taxDist.get(p.id) || 0;
    const pFee = feeDist.get(p.id) || 0;

    const rawTotal = Math.max(0, pData.subtotal - pDiscount + pService + pTax + pFee);
    const { rounded, diff } = applyRounding(
      rawTotal,
      charges.roundingStep,
      charges.roundingMode
    );

    sumParticipantRaw += rawTotal;
    sumParticipantRounded += rounded;

    return {
      participantId: p.id,
      name: p.name,
      itemSubtotal: pData.subtotal,
      items: pData.items,
      proportionalDiscount: pDiscount,
      proportionalService: pService,
      proportionalTax: pTax,
      proportionalAdditionalFee: pFee,
      rawTotal,
      roundingDiff: diff,
      finalTotal: rounded,
      paymentStatus: "pending",
    };
  });

  const rawGrandTotal = subtotal - discountAmount + serviceChargeAmount + taxAmount + additionalFeeAmount;
  const roundingAdjustment = sumParticipantRounded - rawGrandTotal;
  const finalGrandTotal = sumParticipantRounded;

  // 8. Sanity validation check
  const isBalanced = sumParticipantRounded === finalGrandTotal;
  const discrepancy = sumParticipantRounded - finalGrandTotal;

  return {
    subtotal,
    discountAmount,
    serviceChargeAmount,
    taxAmount,
    additionalFeeAmount,
    rawGrandTotal,
    roundingAdjustment,
    finalGrandTotal,
    participants: participantResults,
    isBalanced,
    discrepancy,
  };
}
