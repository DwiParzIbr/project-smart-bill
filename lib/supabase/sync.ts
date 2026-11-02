import { createClient, isSupabaseConfigured } from "./client";
import { getAllBills, saveCompletedBill, StoredBillRecord } from "../storage/bill-storage";
import { UserProfile } from "../types/user";

export interface SyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  error?: string;
}

/**
 * Pushes all locally stored IndexedDB bills to Supabase under the authenticated user.
 */
export async function syncLocalBillsToSupabase(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, uploadedCount: 0, downloadedCount: 0, error: "Supabase not configured" };
  }

  const supabase = createClient();
  if (!supabase) {
    return { success: false, uploadedCount: 0, downloadedCount: 0, error: "Client not initialized" };
  }

  try {
    const localRecords = await getAllBills();
    let uploadedCount = 0;

    for (const record of localRecords) {
      const bill = record.bill;
      const result = record.result;

      // 1. Upsert bill
      const { error: billError } = await supabase.from("bills").upsert({
        id: bill.id,
        user_id: userId,
        title: bill.title,
        currency: bill.currency || "IDR",
        date: bill.date || record.updatedAt,
        status: bill.status || "calculated",
        source: bill.source || "manual",
        receipt_image_url: bill.receiptImageUrl,
        subtotal: result?.subtotal || 0,
        tax: result?.taxAmount || 0,
        service: result?.serviceChargeAmount || 0,
        discount: result?.discountAmount || 0,
        grand_total: result?.finalGrandTotal || 0,
        charges: bill.charges || {},
        payers: bill.payers || [],
        raw_bill_data: bill,
        raw_result_data: result,
        updated_at: new Date().toISOString(),
      });

      if (billError) {
        console.error("Failed to sync bill to Supabase:", billError);
        continue;
      }

      // 2. Upsert participants
      if (result?.participants && result.participants.length > 0) {
        const participantRows = result.participants.map((p, idx) => ({
          id: p.participantId,
          bill_id: bill.id,
          name: p.name,
          display_order: idx,
          payment_status: p.paymentStatus || "pending",
          allocated_amount: p.finalTotal || 0,
          paid_at: p.paidAt || null,
        }));

        await supabase.from("bill_participants").upsert(participantRows);
      }

      // 3. Upsert items
      if (bill.items && bill.items.length > 0) {
        const itemRows = bill.items.map((item) => ({
          id: item.id,
          bill_id: bill.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          assignments: item.assignments || [],
        }));

        await supabase.from("bill_items").upsert(itemRows);
      }

      uploadedCount++;
    }

    return {
      success: true,
      uploadedCount,
      downloadedCount: 0,
    };
  } catch (err: any) {
    console.error("Sync error:", err);
    return {
      success: false,
      uploadedCount: 0,
      downloadedCount: 0,
      error: err.message || "Unknown sync error",
    };
  }
}

/**
 * Pulls bills from Supabase and restores them to the user's local device storage
 */
export async function fetchBillsFromSupabase(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, uploadedCount: 0, downloadedCount: 0, error: "Supabase not configured" };
  }

  const supabase = createClient();
  if (!supabase) {
    return { success: false, uploadedCount: 0, downloadedCount: 0, error: "Client not initialized" };
  }

  try {
    const { data: bills, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error || !bills) {
      return { success: false, uploadedCount: 0, downloadedCount: 0, error: error?.message };
    }

    let downloadedCount = 0;
    for (const row of bills) {
      if (row.raw_bill_data && row.raw_result_data) {
        await saveCompletedBill(row.raw_bill_data, row.raw_result_data);
        downloadedCount++;
      }
    }

    return {
      success: true,
      uploadedCount: 0,
      downloadedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      uploadedCount: 0,
      downloadedCount: 0,
      error: err.message || "Failed to fetch cloud bills",
    };
  }
}
