"use server";
import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";
import { cache } from "react";
import { revalidateAllPaths } from "./revalidate";

export interface Payment {
  id: number;
  paid_at: string;
  customer_id: string;
  production_id: string;
  amount_paid: number;
  sale_id: string;
  type: string;
}

export interface PaymentRow {
  id: number;
  paid_at: string;
  customer_id: string;
  amount_paid: number | null;
  production_id: string | null;
  sale_id: string | null;
  type: "on_demand" | "after";
}

export interface Create {
  customerId: string;
  amountPaid: number;
  saleId?: string;
  productionId: string | null;
  type: string;
}

export async function getPaymentById(paymentId: string) {
  try {
    const supabase = await createClient();
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (error) {
      return null;
    }

    return payment;
  } catch {
    return null;
  }
}

export interface PaymentWithDetails {
  id: string;
  amount_paid: number;
  paid_at: string;
  customer_id: string;
  production_id: string | null;
  sale_id: string | null;
  type: string;
  customers: {
    id: string;
    name: string;
  };
  productions: {
    id: string;
    created_at: string;
  } | null;
}

export interface FilteredPayment {
  id: number;
  amount_paid: number;
  paid_at: string;
  customer_id: string;
  production_id: string | null;
  sale_id: string | null;
  type: string;
  customer_name: string;
  production_date: string | null;
}

export const fetchFilteredPayments = async (
  page: number,
  limit: number,
  customerId?: string | null,
  productionId?: string | null,
  startDate?: string | null,
  endDate?: string | null
): Promise<FilteredPayment[]> => {
  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("fetch_payments_paginated", {
      p_limit: limit,
      p_offset: offset,
      p_customer_id: customerId || null,
      p_production_id: productionId || null,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      return [];
    }

    return (data as unknown as FilteredPayment[]) || [];
  } catch {
    return [];
  }
};

export const fetchAllPaymentsWithDetails = async (
  page: number,
  limit: number
) => {
  // page here represents the batch number, not the actual page
  // Batch 1 (pages 1-5) -> offset 0
  // Batch 2 (pages 6-10) -> offset 50
  const offset = (page - 1) * limit;
  try {
    const supabase = await createClient();
    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        `
        id,
        amount_paid,
        paid_at,
        customer_id,
        production_id,
        sale_id,
        type,
        customers!customer_id (
          id,
          name
        ),
        productions!production_id (
          id,
          created_at
        )
      `
      )
      .order("paid_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return [];
    }

    return (payments as unknown as PaymentWithDetails[]) || [];
  } catch {
    return [];
  }
};

export async function getPaymentsByCustomerID(
  customerId: string,
  limit: number = 10,
  page: number = 1
) {
  try {
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const supabase = await createClient();
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("customer_id", customerId)
      .order("paid_at", { ascending: false })
      .range(start, end)
      .select();

    if (error) {
      return null;
    }

    return payments;
  } catch {
    return null;
  }
}

/**
 * Atomic payment creation for a specific sale
 * Replaces: addPayment + updateSale (for sale-specific payments)
 */
export const createPaymentForSale = async (
  customerId: string,
  saleId: string,
  amountPaid: number,
  productionId: string | null = null
) => {
  try {
    const supabase = await createClient();
    // Call atomic RPC function
    const { data, error } = await supabase.rpc(
      "create_payment_for_sale_atomic",
      {
        p_customer_id: customerId,
        p_sale_id: saleId,
        p_amount_paid: amountPaid,
        p_production_id: productionId,
      }
    );

    if (error) {
      throw new Error(error.message || "Failed to create payment");
    }

    // Revalidate all affected caches
    revalidateTag("payments", {});
    revalidateTag("sales", {});
    revalidateTag("customers", {});
    revalidateTag("productions", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", data };
  } catch {
    throw new Error("Unexpected Error Occured");
  }
};

/**
 * @deprecated For sale-specific payments, use createPaymentForSale instead
 * Legacy function kept for backward compatibility
 */
export async function addPayment(payload: Create) {
  try {
    const supabase = await createClient();
    const { data: paymentData, error } = await supabase
      .from("payments")
      .insert({
        amount_paid: payload.amountPaid,
        customer_id: payload.customerId,
        production_id: payload.productionId,
        sale_id: payload.saleId,
        type: payload.type,
      })
      .select();

    if (error) {
      throw new Error("Database Error Occured");
    }
    await revalidateAllPaths();
    return { status: "SUCCESS", error: "", res: paymentData[0] };
  } catch (error) {
    throw error;
  }
}

export interface DistributePaymentResult {
  success: boolean;
  amount_paid: number;
  amount_applied: number;
  amount_remaining: number;
  sales_fully_cleared: number;
  sales_partially_paid: number;
  cleared_sale_ids: string[];
  updated_sale_ids: string[];
  old_debt: number;
  new_debt: number;
}

/**
 * Distributes a payment across multiple unpaid sales for a customer
 * Automatically clears oldest unpaid sales first
 * @param customerId - The customer's UUID
 * @param amountPaid - The amount being paid
 * @returns Summary of what was cleared/updated
 */
export async function distributePaymentAcrossSales(
  customerId: string,
  amountPaid: number,
  productionId: string | null = null
): Promise<{ status: string; error: string; data?: DistributePaymentResult }> {
  try {
    const supabase = await createClient();
    // Call the Supabase function
    const { data, error } = await supabase.rpc(
      "distribute_payment_across_sales",
      {
        p_customer_id: customerId,
        p_amount_paid: amountPaid,
        p_production_id: productionId,
      }
    );

    if (error) {
      throw new Error("Failed to distribute payment: " + error.message);
    }

    await revalidateAllPaths();

    return {
      status: "SUCCESS",
      error: "",
      data: data as DistributePaymentResult,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unexpected error occurred";
    return {
      status: "ERROR",
      error: errorMessage,
    };
  }
}

export const updatePayment = async (
  paymentId: string,
  payload: Partial<Create>
) => {
  try {
    if (!payload.amountPaid) {
      throw new Error("Amount paid is required for update");
    }

    const supabase = await createClient();
    // Call atomic RPC function
    const { data, error } = await supabase.rpc("update_payment_atomic", {
      p_payment_id: Number(paymentId),
      p_new_amount: payload.amountPaid,
    });

    if (error) {
      throw new Error(error.message || "Failed to update payment");
    }

    revalidateTag("payments", {});
    revalidateTag("customers", {});
    revalidateTag("productions", {});
    revalidateTag("sales", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", data };
  } catch (error) {
    const errorMsg = String(error);
    const parts = errorMsg.split(":");
    return {
      status: "ERROR",
      error: parts[parts.length - 1].trim(),
      data: null,
    };
  }
};

export const deletePayment = async (paymentId: string) => {
  try {
    const supabase = await createClient();
    // Call atomic RPC function
    const { error } = await supabase.rpc("delete_payment_atomic", {
      p_payment_id: Number(paymentId),
    });

    if (error) {
      throw new Error(error.message || "Failed to delete payment");
    }

    revalidateTag("payments", {});
    revalidateTag("customers", {});
    revalidateTag("productions", {});
    revalidateTag("sales", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "" };
  } catch (error) {
    const errorMsg = String(error);
    const parts = errorMsg.split(":");
    return {
      status: "ERROR",
      error: parts[parts.length - 1].trim(),
      data: null,
    };
  }
};
