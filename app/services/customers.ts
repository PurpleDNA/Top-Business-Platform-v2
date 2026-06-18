/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { createClient } from "@/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cache } from "react";
import { revalidateAllPaths } from "./revalidate";
export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  has_debt: boolean;
  total_debt: number;
  payment_history: {
    date: string;
    amount_paid: number;
  }[];
  created_at: string;
  updated_at: string;
}

interface Create {
  name: string;
  phoneNumber: string;
  hasDebt: boolean;
  debtAmount?: string;
}

export const fetchAllCustomers = cache(async (): Promise<Customer[] | []> => {
  try {
    const supabase = await createClient();
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return customers;
  } catch {
    return [];
  }
});

export const getCustomerCount = async () => {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });
    if (error) {
      throw error;
    }
    return count;
  } catch {
  }
};

export const fetchCustomerById = async (id: string) => {
  try {
    const supabase = await createClient();
    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    return customer;
  } catch {
    return null;
  }
};

export const fetchCustomerTotalSpent = async (customerId: string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "calculate_customer_total_spent",
      {
        customer_uuid: customerId,
      }
    );
    if (error) {
      throw error;
    }
    return data;
  } catch {
    return 0;
  }
};

export const fetchCustomerMonthlyPurchases = async (customerId: string) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "get_customer_monthly_purchases",
      {
        p_customer_id: customerId,
      }
    );

    if (error) {
      throw error;
    }

    return data || [];
  } catch {
    return [];
  }
};

export const createCustomer = async (payload: Create) => {
  try {
    const supabase = await createClient();
    const { data: customerData, error } = await supabase
      .from("customers")
      .insert({
        name: payload.name,
        phone_number: payload.phoneNumber,
        initial_debt: Number(payload.debtAmount) || 0,
      })
      .select();

    if (error) {
      throw new Error(error.message);
    }
    revalidatePath("customers/all");
    revalidateTag("customers", {});
    revalidateTag("customers_count", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", res: customerData[0] };
  } catch (error) {
    const parts = String(error).split(":");
    return {
      status: "ERROR",
      error: parts[parts.length - 1].trim(),
      res: null,
    };
  }
};

export const searchCustomers = async (searchTerm: string) => {
  if (!searchTerm || searchTerm.length < 2) {
    return []; // Don't search for very short terms
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_customers", {
      search_term: searchTerm,
    });

    if (error) {
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
};

export const updateCustomer = async (
  customerId: string,
  payload: Record<string, any>
) => {
  try {
    const supabase = await createClient();
    const { data: UpdatedData, error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", customerId)
      .select();

    if (error) {
      throw new Error(error.message);
    }
    revalidatePath("/customers/all");
    revalidateTag("customers", {});
    await revalidateAllPaths();
    return { status: "SUCCESS", error: "", res: UpdatedData };
  } catch (error) {
    const parts = String(error).split(":");
    return {
      status: "ERROR",
      error: parts[parts.length - 1].trim(),
      res: null,
    };
  }
};

export const deleteCustomer = async (customerId: string) => {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (error) {
      throw new Error(error.message);
    }
    revalidatePath("/customers/all");
    revalidateTag("customers", {});
    revalidateTag("customers_count", {});
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
