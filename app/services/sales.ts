"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cache } from "react";
import { revalidateAllPaths } from "./revalidate";

interface CreateSale {
  customer_id: string;
  production_id: string;
  amount: string;
  paid: boolean;
  remaining: number;
  quantity?: {
    [key: string]: number;
  };
  amount_paid: string;
}

export interface Sale {
  customer_id: string;
  production_id: string;
  amount: number;
  paid: boolean;
  remaining: number;
  outstanding?: number;
  amount_paid: number;
  quantity_bought: {
    [key: string]: number;
  };
}

interface SaleWithCustomer {
  id: string;
  amount: number;
  paid: boolean;
  outstanding: number;
  created_at: string;
  customer_id: string;
  production_id: string;
  customers: {
    id: string;
    name: string;
  };
  quantity_bought: { [key: string]: number };
}

export interface SaleWithDetails {
  id: string;
  amount: number;
  paid: boolean;
  outstanding: number;
  remaining: number;
  amount_paid: number;
  created_at: string;
  customer_id: string;
  production_id: string;
  quantity_bought: { [key: string]: number };
  customers: {
    id: string;
    name: string;
  };
  productions: {
    id: string;
    created_at: string;
  };
}

export interface FilteredSale {
  id: string;
  amount: number;
  paid: boolean;
  outstanding: number;
  remaining: number;
  amount_paid: number;
  created_at: string;
  customer_id: string;
  production_id: string;
  quantity_bought: { [key: string]: number };
  customer_name: string;
  production_date: string;
}

export const fetchFilteredSales = async (
  page: number,
  limit: number,
  customerId?: string | null,
  productionId?: string | null,
  startDate?: string | null,
  endDate?: string | null
): Promise<FilteredSale[]> => {
  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("fetch_sales_paginated", {
      p_limit: limit,
      p_offset: offset,
      p_customer_id: customerId || null,
      p_production_id: productionId || null,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      console.error("Error fetching filtered sales:", error);
      return [];
    }

    return (data as unknown as FilteredSale[]) || [];
  } catch (error) {
    console.error("Unexpected error in fetchFilteredSales:", error);
    return [];
  }
};

export const fetchAllSales = async (page: number, limit: number) => {
  const offset = page * limit;
  try {
    const supabase = await createClient();
    const { data: sales, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      console.error("Error fetching sales:", error);
      return [];
    }
    return sales;
  } catch (error) {
    console.error("Unexpected error in fetchAllSales:", error);
    return [];
  }
};

export const fetchAllSalesWithDetails = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  try {
    const supabase = await createClient();
    const { data: sales, error } = await supabase
      .from("sales")
      .select(
        `
        id,
        amount,
        paid,
        outstanding,
        remaining,
        amount_paid,
        created_at,
        customer_id,
        production_id,
        quantity_bought,
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
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching sales with details:", error);
      return [];
    }

    return (sales as unknown as SaleWithDetails[]) || [];
  } catch (error) {
    console.error("Unexpected error in fetchAllSalesWithDetails:", error);
    return [];
  }
};

export const fetchSalesByCustomerId = async (customerId: string) => {
  try {
    const supabase = await createClient();
    const { data: sales, error } = await supabase
      .from("sales")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales by customer ID:", error);
      return [];
    }

    return sales;
  } catch (error) {
    console.error("Unexpected error in fetchSalesByCustomerId:", error);
    return [];
  }
};

export const fetchSaleById = async (saleId: string) => {
  try {
    const supabase = await createClient();
    const { data: sale, error } = await supabase
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (error) {
      throw new Error("Error fetching sale by ID:", error);
    }

    return sale;
  } catch (error) {
    console.error("Unexpected error in fetchSaleById:", error);
    return [];
  }
};

export const fetchSalesByProductionId = cache(async (productionId: string) => {
  try {
    const supabase = await createClient();
    const { data: sales, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        customers!customer_id (
          id,
          name
        )
      `
      )
      .eq("production_id", productionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales with customer:", error);
      return [];
    }

    return (sales as unknown as SaleWithCustomer[]) || [];
  } catch (error) {
    console.error("Unexpected error in fetchSalesByProductionId:", error);
    return [];
  }
});

/**
 * Atomic sale creation with payment and inventory update
 * Replaces: createNewSale + addPayment + updateSoldBread
 */
export const createSaleWithPaymentAndInventory = async (
  payload: CreateSale
) => {
  try {
    const supabase = await createClient();
    // Call atomic RPC function
    const { data, error } = await supabase.rpc(
      "create_sale_with_payment_and_inventory",
      {
        p_customer_id: payload.customer_id,
        p_production_id: payload.production_id,
        p_amount: Number(payload.amount),
        p_amount_paid: Number(payload.amount_paid) || 0,
        p_quantity_bought: payload.quantity || {},
        p_outstanding: payload.remaining,
      }
    );

    if (error) {
      console.error("create_sale_with_payment_and_inventory error:", error);
      throw new Error(error.message || "Failed to create sale");
    }

    // Revalidate all affected caches
    revalidatePath("/sales/all");
    revalidateTag("sales", {});
    revalidateTag("salesByProd", {});
    revalidateTag("payments", {});
    revalidateTag("customers", {});
    revalidateTag("productions", {});
    revalidateTag("last10", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", data };
  } catch (error) {
    console.log("create sale error>>>>>>", error);
    throw new Error("Unexpected Error Occured");
  }
};

/**
 * @deprecated Use createSaleWithPaymentAndInventory for new code
 * Legacy function kept for backward compatibility
 */
export const createNewSale = async (payload: CreateSale) => {
  try {
    const supabase = await createClient();
    // 1. Create the sale record
    const { data: saleData, error } = await supabase
      .from("sales")
      .insert({
        customer_id: payload.customer_id,
        production_id: payload.production_id,
        amount: Number(payload.amount),
        amount_paid: payload.amount_paid || 0,
        outstanding: payload.remaining,
        quantity_bought: payload.quantity,
      })
      .select("*")
      .single();

    if (error) {
      console.log(error);
      throw new Error("Create Sale Error");
    }

    revalidatePath("/sales/all");
    revalidateTag("sales", {});
    revalidateTag("salesByProd", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", res: saleData };
  } catch (error) {
    console.log("create sale error>>>>>>", error);
    throw new Error("Unexpected Error Occured");
  }
};

export const getUnpaidSalesByCustomerId = async (customerId: string) => {
  try {
    const supabase = await createClient();
    const { data: unpaidSales, error } = await supabase
      .from("sales")
      .select("*")
      .eq("customer_id", customerId)
      .eq("paid", false)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("get unpaid sales error");
    }
    return { status: "SUCCESS", error: "", data: unpaidSales };
  } catch (error) {
    console.log("get unpaid sales error >>>>>>", error);
    throw new Error("Unexpected Error Occured");
  }
};

export const updateSale = async (saleId: string, payload: Partial<Sale>) => {
  try {
    const supabase = await createClient();
    // Call atomic RPC function
    const { data, error } = await supabase.rpc("update_sale_atomic", {
      p_sale_id: saleId,
      p_amount: payload.amount || null,
      p_amount_paid: payload.amount_paid || null,
      p_quantity_bought: payload.quantity_bought || null,
      p_outstanding: payload.outstanding || null,
    });

    if (error) {
      throw new Error(error.message || "Failed to update");
    }

    revalidatePath("sales/all");
    revalidateTag("sales", {});
    revalidateTag("salesByProd", {});
    revalidateTag("payments", {});
    revalidateTag("customers", {});
    revalidateTag("productions", {});
    revalidateTag("last10", {});
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

export const deleteSale = async (saleId: string) => {
  try {
    const supabase = await createClient();
    // Call atomic RPC function
    const { error } = await supabase.rpc("delete_sale_atomic", {
      p_sale_id: saleId,
    });

    if (error) {
      console.error("delete_sale_atomic error:", error);
      throw new Error(error.message || "Failed to delete sale");
    }

    revalidateTag("sales", {});
    revalidateTag("customers", {});
    revalidateTag("productions", {});
    revalidateTag("customer_purchases", {});
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
