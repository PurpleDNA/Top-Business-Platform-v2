"use server";
import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";
import { cache } from "react";
import { revalidateAllPaths } from "./revalidate";
import { isSuperAdmin } from "./roles";

export interface BreadPrice {
  id: number;
  color: string;
  price: number;
  created_at: string;
  updated_at: string;
}

interface CreateBreadPrice {
  color: string;
  price: number;
}

interface UpdateBreadPrice {
  price: number;
}

/**
 * Fetch all bread prices
 */
export const fetchAllBreadPrices = async (): Promise<BreadPrice[]> => {
  try {
    const supabase = await createClient();
    const { data: breadPrices, error } = await supabase
      .from("bread_price")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching bread prices:", error);
      return [];
    }

    return breadPrices || [];
  } catch (error) {
    console.error("Unexpected error in fetchAllBreadPrices:", error);
    return [];
  }
};

/**
 * Fetch bread price by ID
 */
export const fetchBreadPriceById = async (
  id: string
): Promise<BreadPrice | null> => {
  try {
    const supabase = await createClient();
    const { data: breadPrice, error } = await supabase
      .from("bread_price")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching bread price by ID:", error);
      return null;
    }

    return breadPrice;
  } catch (error) {
    console.error("Unexpected error in fetchBreadPriceById:", error);
    return null;
  }
};

/**
 * Create a new bread price entry
 */
export const createBreadPrice = async (payload: CreateBreadPrice) => {
  try {
    const isAllowed = await isSuperAdmin();
    if (!isAllowed) {
      throw new Error("Unauthorized: Only Super Admins can manage prices.");
    }

    const supabase = await createClient();
    const { data: breadPriceData, error } = await supabase
      .from("bread_price")
      .insert({
        color: payload.color,
        price: payload.price,
      })
      .select();

    if (error) {
      console.error("Create Bread Price Error:", error);
      throw new Error("Failed to create bread price");
    }

    revalidateTag("bread_prices", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", data: breadPriceData[0] };
  } catch (error) {
    console.error("Unexpected error in createBreadPrice:", error);
    throw new Error(String(error));
  }
};

/**
 * Update an existing bread price
 */
export const updateBreadPrice = async (
  breadPriceId: number,
  payload: UpdateBreadPrice
) => {
  try {
    const isAllowed = await isSuperAdmin();
    if (!isAllowed) {
      throw new Error("Unauthorized: Only Super Admins can manage prices.");
    }

    const supabase = await createClient();
    const { data: updatedBreadPrice, error } = await supabase
      .from("bread_price")
      .update(payload)
      .eq("id", breadPriceId)
      .select();

    if (error) {
      console.error("Update Bread Price Error:", error);
      throw new Error("Failed to update bread price");
    }

    revalidateTag("bread_prices", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", data: updatedBreadPrice[0] };
  } catch (error) {
    console.error("Unexpected error in updateBreadPrice:", error);
    throw new Error(String(error));
  }
};

/**
 * Delete a bread price entry
 */
export const deleteBreadPrice = async (breadPriceId: number) => {
  try {
    const isAllowed = await isSuperAdmin();
    if (!isAllowed) {
      throw new Error("Unauthorized: Only Super Admins can manage prices.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("bread_price")
      .delete()
      .eq("id", breadPriceId);

    if (error) {
      console.error("Delete Bread Price Error:", error);
      throw new Error("Failed to delete bread price");
    }

    revalidateTag("bread_prices", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "" };
  } catch (error) {
    console.error("Unexpected error in deleteBreadPrice:", error);
    throw new Error(String(error));
  }
};

/**
 * Get bread price count
 */
export const getBreadPriceCount = async (): Promise<number> => {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("bread_price")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error getting bread price count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Unexpected error in getBreadPriceCount:", error);
    return 0;
  }
};

export const getBreadPriceMultipliers = cache(
  async (): Promise<Record<string, number>> => {
    try {
      const breadPrices = (await fetchAllBreadPrices()).sort(
        (a, b) => b.price - a.price
      );
      // Convert array of bread prices to a Record<color, price>
      const multipliers: Record<string, number> = {};

      breadPrices.forEach((breadPrice) => {
        multipliers[breadPrice.color.toLowerCase()] = breadPrice.price;
      });

      return multipliers;
    } catch (error) {
      console.error("Unexpected error in getBreadPriceMultipliers:", error);
      return {};
    }
  }
);
