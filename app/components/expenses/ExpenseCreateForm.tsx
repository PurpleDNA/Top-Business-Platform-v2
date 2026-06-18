/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createExpense } from "@/app/services/expenses";
import React, { useActionState, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import z from "zod";
import { notify, messages, getErrorMessage } from "@/lib/notifications";
import { formatDateTime, getTimeFrame } from "@/app/services/utils";
import {
  Production,
  getLast10Productions,
  getProductionById,
} from "@/app/services/productions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams } from "next/navigation";
import { ExpenseCreateFormSkeleton } from "./ExpenseCreateFormSkeleton";

const validate = z.object({
  production_id: z.string().min(1, "Production ID is required"),
  expense: z.string().min(1, "Expense description is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

const ExpenseCreateForm = () => {
  const searchParams = useSearchParams();
  const production_id = searchParams.get("production_id");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<
    Production | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [payload, setPayload] = useState({
    production_id: "",
    expense: "",
    amount: "",
  });

  // Fetch productions and specific production on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch last 10 productions
        const productionsList = (await getLast10Productions()) ?? [];
        setProductions(productionsList);

        // If production_id is in URL, fetch that specific production
        if (production_id) {
          const specificProduction = await getProductionById(production_id);
          setSelectedProduction(specificProduction);
          setPayload((prev) => ({
            ...prev,
            production_id: specificProduction.id,
          }));
        } else if (productionsList.length > 0) {
          // Otherwise, select the first production
          setSelectedProduction(productionsList[0]);
          setPayload((prev) => ({
            ...prev,
            production_id: productionsList[0].id,
          }));
        }
      } catch (error) {
        notify.error(messages.generic.loadFailed);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [production_id]);

  async function handleSubmit(prevState: any, formData: FormData) {
    const values = {
      production_id: payload.production_id,
      expense: formData.get("expense") as string,
      amount: formData.get("amount"),
    };

    setErrors({});

    try {
      await validate.parseAsync(values);
      const response = await createExpense({
        production_id: payload.production_id,
        expense: payload.expense,
        amount: Number(payload.amount),
      });

      if (response.status === "SUCCESS") {
        notify.success(messages.expense.created);
        // Reset form after successful submission
        setPayload({
          production_id: selectedProduction?.id || "",
          expense: "",
          amount: "",
        });
      } else {
        notify.error(getErrorMessage(response.error, messages.expense.createFailed));
      }
      return response;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as unknown as Record<string, string>);
        notify.error(messages.generic.validation);
        return { status: "ERROR", error: fieldErrors };
      } else {
        notify.fromError(error, messages.expense.createFailed);
      }
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, {
    status: "",
    error: "",
  });

  if (isLoading) {
    return <ExpenseCreateFormSkeleton />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 items-center my-5">
      <div className="w-full">
        <label htmlFor="expense" className="text-sm">
          Expense Description
        </label>
        <Input
          type="text"
          placeholder="e.g. Raw materials, Labor, Transport"
          name="expense"
          className="w-full mt-1"
          onChange={(e) => {
            setPayload((prev) => ({
              ...prev,
              expense: e.target.value,
            }));
          }}
          value={payload.expense}
        />
        {errors.expense && (
          <p className="text-red-500 text-xs mt-1">{errors.expense}</p>
        )}
      </div>

      <div className="w-full">
        <label htmlFor="amount" className="text-sm">
          Amount
        </label>
        <Input
          type="number"
          placeholder="Amount"
          name="amount"
          className="w-full mt-1 no-spinners"
          onChange={(e) => {
            setPayload((prev) => ({
              ...prev,
              amount: e.target.value,
            }));
          }}
          value={payload.amount}
        />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
        )}
      </div>

      <div className="w-full">
        <label className="mb-1 text-sm">Production</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-center py-3 px-3 border rounded-md border-primary shadow ring font-semibold cursor-pointer">
              {selectedProduction
                ? formatDateTime(selectedProduction.created_at)
                : "Select Production"}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-32 overflow-y-auto">
            {productions?.map((prod) => (
              <DropdownMenuItem
                key={prod.id}
                onClick={() => {
                  setSelectedProduction(prod);
                  setPayload((prev) => ({
                    ...prev,
                    production_id: prod.id,
                  }));
                }}
              >
                {formatDateTime(prod.created_at)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedProduction && (
          <span className="text-xs text-primary">
            {getTimeFrame(selectedProduction.created_at)}
          </span>
        )}
        {errors.production_id && (
          <p className="text-red-500 text-xs mt-1">{errors.production_id}</p>
        )}
      </div>

      <Button
        className="bg-primary font-bungee cursor-pointer"
        disabled={isPending}
        type="submit"
      >
        Create{isPending && <LoaderCircle size={15} className="animate-spin" />}
      </Button>
    </form>
  );
};

export default ExpenseCreateForm;
