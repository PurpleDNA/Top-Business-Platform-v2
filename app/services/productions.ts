"use server";
import { createClient } from "@/supabase/server";
import { revalidateAllPaths } from "./revalidate";
import { revalidatePath, updateTag } from "next/cache";
import { cache } from "react";
import { getBreadPriceMultipliers } from "./bread_price";
import { isSuperAdmin } from "./roles";

export interface Production {
  id: string;
  quantity: Record<string, number>;
  old_bread: Record<string, number>;
  sold_bread: Record<string, number>;
  bread_price: Record<string, number>;
  total: number;
  cash: number;
  created_at: string;
  updated_at: string;
  open: boolean;
  remaining_bread?: Record<string, number>;
}

interface Create {
  quantity: Record<string, string>;
  total: string;
  old_bread: Record<string, string>;
  bread_price: Record<string, number>;
}

interface PaymentWithCustomer {
  amount_paid: number;
  customer_id: string;
  customers: {
    id: string;
    name: string;
  } | null;
}

interface SaleWithCustomer {
  outstanding: number;
  paid: boolean;
  customer_id: string;
  customers: {
    id: string;
    name: string;
  };
}

export const createProduction = async (payload: Create) => {
  try {
    const quantity = Object.fromEntries(
      Object.entries(payload.quantity).map(([key, value]) => [
        key,
        Number(value),
      ]),
    );

    const old_bread = Object.fromEntries(
      Object.entries(payload.old_bread).map(([key, value]) => [
        key,
        Number(value),
      ]),
    );

    const sold_bread: { [key: string]: number } = {};
    Object.keys(quantity).forEach((key) => {
      sold_bread[key] = 0;
    });

    const supabase = await createClient();
    const { data: ProductionData, error } = await supabase
      .from("productions")
      .insert({
        quantity: quantity,
        old_bread: old_bread,
        sold_bread: sold_bread,
        bread_price: payload.bread_price,
        cash: 0,
        open: true,
      })
      .select();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/production/all");
    updateTag("productions");
    updateTag("last10");
    updateTag("latestProd");
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", res: ProductionData[0] };
  } catch (error) {
    const parts = String(error).split(":");
    return {
      status: "ERROR",
      error: parts[parts.length - 1].trim(),
      res: null,
    };
  }
};

export const getLatestProduction = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: lastProduction, error } = await supabase
      .from("productions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }
    if (lastProduction && lastProduction.length > 0) {
      return lastProduction[0];
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(String(error));
  }
});

export const getLast10Productions = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: last10, error } = await supabase
      .from("productions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return last10;
  } catch (error) {
    throw new Error(String(error));
  }
});

export const getProductionById = async (id: string) => {
  try {
    const supabase = await createClient();
    const { data: production, error } = await supabase
      .from("productions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      return null;
    }

    return production;
  } catch {
    return null;
  }
};

/**
 * Check if a production is closed (not open)
 * @param productionId - The production ID to check
 * @returns Object with isClosed boolean and optional error message
 */
export const checkProductionClosed = async (
  productionId: string | null | undefined,
) => {
  try {
    // If no production ID provided, it's valid (e.g., payments without production_id)
    if (!productionId) {
      return { isClosed: false, error: null };
    }

    const production = await getProductionById(productionId);

    if (!production) {
      return {
        isClosed: true,
        error: "Production not found",
      };
    }

    if (!production.open) {
      return {
        isClosed: true,
        error: "Production is closed",
      };
    }

    return { isClosed: false, error: null };
  } catch (error) {
    return {
      isClosed: true,
      error: "Failed to verify production status",
    };
  }
};

export const fetchAllProductions = cache(
  async (): Promise<Production[] | []> => {
    try {
      const supabase = await createClient();
      const { data: productions, error } = await supabase
        .from("productions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return [];
      }

      return productions;
    } catch {
      return [];
    }
  },
);

export const getProductionOutstanding = async (productionId: string) => {
  try {
    const supabase = await createClient();
    const { data: outstanding, error } = await supabase
      .from("sales")
      .select(
        `
        outstanding,
        paid,
        customer_id,
        customers!customer_id (
          id,
          name
        )
      `,
      )
      .eq("production_id", productionId)
      .gt("outstanding", 0)
      .order("created_at", { ascending: false });

    if (error) {
      return null;
    }

    // Transform the data to return a cleaner structure
    const transformed =
      (outstanding as unknown as SaleWithCustomer[])?.map((sale) => ({
        customer_id: sale.customer_id,
        customer_name: sale.customers?.name || "Unknown",
        outstanding: sale.outstanding,
        paid: sale.paid,
      })) || [];

    return transformed;
  } catch {
    return null;
  }
};

export const getProductionPaidOutstanding = async (productionId: string) => {
  try {
    const supabase = await createClient();
    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        `
        amount_paid,
        customer_id,
        customers!customer_id (
          id,
          name
        )
      `,
      )
      .eq("production_id", productionId)
      .eq("type", "after")
      .order("paid_at", { ascending: false });

    if (error) {
      return null;
    }

    // Transform the data to return a cleaner structure
    const transformed =
      (payments as unknown as PaymentWithCustomer[])?.map((payment) => ({
        customer_id: payment.customer_id,
        customer_name: payment.customers?.name || "Unknown",
        amount: payment.amount_paid,
      })) || [];

    return transformed;
  } catch {
    return null;
  }
};

export const toggleProdStatus = async (productionId: string) => {
  try {
    const isAllowed = await isSuperAdmin();
    if (!isAllowed) {
      throw new Error(
        "Unauthorized: Only Super Admins can open/close productions.",
      );
    }

    // Call atomic RPC function
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "toggle_production_status_atomic",
      {
        p_production_id: productionId,
      },
    );

    if (error) {
      throw new Error(error.message || "Failed to toggle production status");
    }

    updateTag("productions");
    updateTag("last10");
    updateTag("latestProd");
    await revalidateAllPaths();

    return {
      status: "SUCCESS",
      data,
      newStatus: data.new_status,
    };
  } catch (error) {
    return { status: "ERROR", error: String(error) };
  }
};

export const updateProduction = async (
  productionId: string,
  payload: Partial<Production>,
) => {
  try {
    // Check if production is closed
    const closureCheck = await checkProductionClosed(productionId);
    if (closureCheck.isClosed) {
      throw new Error(
        "This production is closed and can no longer be updated.",
      );
    }

    const supabase = await createClient();
    const { data: updatedProduction, error } = await supabase
      .from("productions")
      .update(payload)
      .eq("id", productionId)
      .select();

    if (error) {
      throw new Error(error.message);
    }
    revalidatePath("/productions/all");
    updateTag("productions");
    updateTag("last10");
    updateTag("latestProd");
    await revalidateAllPaths();

    return { status: "SUCCESS", data: updatedProduction[0] };
  } catch (error) {
    return { status: "ERROR", error: String(error) };
  }
};

/**
 * @deprecated This function is no longer needed.
 * The database trigger automatically updates sold_bread when sales are created/updated/deleted.
 * Keeping this function for backward compatibility only.
 */
export const updateSoldBread = async (
  _productionId: string,
  _soldQuantity: Record<string, number>,
) => {
  // Return success immediately since the trigger handles this
  return {
    status: "SUCCESS",
    data: null,
    message: "Handled by database trigger",
  };
};

export const calculateBreadTotal = async (
  breadQuantities: { [key: string]: number } | null | undefined,
  production?: Production | null,
): Promise<number> => {
  try {
    if (!breadQuantities) return 0;

    // Get bread prices from production.bread_price if available, otherwise get current prices
    let breadPrices: { [key: string]: number };

    if (production && production.bread_price) {
      breadPrices = production.bread_price;
    } else {
      // Fallback to current bread prices
      breadPrices = await getBreadPriceMultipliers();
    }

    // Calculate total by multiplying each quantity by its price
    let total = 0;
    Object.entries(breadQuantities).forEach(([color, quantity]) => {
      const price = breadPrices[color.toLowerCase()] || 0;
      total += quantity * price;
    });

    return total;
  } catch {
    return 0;
  }
};

export const deleteProduction = async (productionId: string) => {
  try {
    // Check if production is closed
    const closureCheck = await checkProductionClosed(productionId);
    if (closureCheck.isClosed) {
      throw new Error(
        "This production is closed and can no longer be deleted.",
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("productions")
      .delete()
      .eq("id", productionId);

    if (error) {
      throw new Error(error.message);
    }
    revalidatePath("/productions/all");
    updateTag("productions");
    updateTag("sales");
    updateTag("payments");
    updateTag("last10");
    updateTag("latestProd");
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "" };
  } catch (error) {
    const parts = String(error).split(":");
    return {
      status: "ERROR",
      error: parts[parts.length - 1].trim(),
    };
  }
};
