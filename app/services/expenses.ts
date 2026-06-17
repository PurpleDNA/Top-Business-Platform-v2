"use server";
import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";
import { cache } from "react";
import { checkProductionClosed } from "./productions";
import { revalidateAllPaths } from "./revalidate";

export interface Expense {
  id: string;
  production_id: string;
  expense: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

interface CreateExpense {
  production_id: string;
  expense: string;
  amount: number;
}

export const createExpense = async (payload: CreateExpense) => {
  try {
    const supabase = await createClient();
    const { data: expenseData, error } = await supabase
      .from("expenses")
      .insert({
        production_id: payload.production_id,
        expense: payload.expense,
        amount: payload.amount,
      })
      .select();

    if (error) {
      throw new Error("Failed to create expense");
    }

    revalidateTag("expenses", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", data: expenseData[0] };
  } catch (error) {
    throw new Error(String(error));
  }
};

export const updateExpense = async (
  expenseId: string,
  payload: Partial<CreateExpense>
) => {
  try {
    const supabase = await createClient();
    // First, get the expense to check its production_id
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("production_id")
      .eq("id", expenseId)
      .single();

    if (fetchError || !existingExpense) {
      throw new Error("Expense not found");
    }

    // Check if production is closed
    const closureCheck = await checkProductionClosed(
      existingExpense.production_id
    );
    if (closureCheck.isClosed) {
      throw new Error(
        "This expense belongs to a closed production and can't be updated."
      );
    }

    const { data: updatedExpense, error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", expenseId)
      .select();

    if (error) {
      throw new Error("Failed to update expense");
    }

    revalidateTag("expenses", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "", data: updatedExpense[0] };
  } catch (error) {
    throw new Error(String(error));
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    const supabase = await createClient();
    // First, get the expense to check its production_id
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("production_id")
      .eq("id", expenseId)
      .single();

    if (fetchError || !existingExpense) {
      throw new Error("Expense not found");
    }

    // Check if production is closed
    const closureCheck = await checkProductionClosed(
      existingExpense.production_id
    );
    if (closureCheck.isClosed) {
      throw new Error(
        "This expense belongs to a closed production and can't be deleted."
      );
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) {
      throw new Error("Failed to delete expense");
    }

    revalidateTag("expenses", {});
    await revalidateAllPaths();

    return { status: "SUCCESS", error: "" };
  } catch (error) {
    throw new Error(String(error));
  }
};

export const getExpensesByProdId = cache(
  async (productionId: string): Promise<Expense[]> => {
    try {
      const supabase = await createClient();
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("production_id", productionId)
        .order("created_at", { ascending: false });

      if (error) {
        return [];
      }

      return expenses || [];
    } catch {
      return [];
    }
  }
);
