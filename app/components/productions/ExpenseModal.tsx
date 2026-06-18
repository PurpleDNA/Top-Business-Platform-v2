"use client";

import { createExpense } from "@/app/services/expenses";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppWindow, LoaderCircle, X } from "lucide-react";
import z from "zod";
import { notify, messages, getErrorMessage } from "@/lib/notifications";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

const validate = z.object({
  production_id: z.string().min(1, "Production ID is required"),
  expense: z.string().min(1, "Expense description is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

interface ExpenseModalProps {
  productionId: string;
}

export const ExpenseModal = ({ productionId }: ExpenseModalProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payload, setPayload] = useState({
    expense: "",
    amount: "",
  });
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isLoading) return;

    const values = {
      production_id: productionId,
      expense: payload.expense,
      amount: payload.amount,
    };

    setErrors({});
    setIsLoading(true);

    try {
      await validate.parseAsync(values);
      const response = await createExpense({
        production_id: productionId,
        expense: payload.expense,
        amount: Number(payload.amount),
      });

      if (response.status === "SUCCESS") {
        notify.success(messages.expense.created);
        // Reset form
        setPayload({
          expense: "",
          amount: "",
        });
        setOpen(false);
        router.refresh();
      } else {
        notify.error(getErrorMessage(response.error, messages.expense.createFailed));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as unknown as Record<string, string>);
        notify.error(messages.generic.validation);
      } else {
        notify.fromError(error, messages.expense.createFailed);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const formContent = (
    <form id="create-expense-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="w-full">
        <label htmlFor="expense" className="text-sm font-medium">
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
        <label htmlFor="amount" className="text-sm font-medium">
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
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="text-white bg-[#fa6161] hover:bg-[#fa6161]/90">
            Add Expense
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Add New Expense
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {formContent}
            <div className="flex gap-2 justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-expense-form"
                className="bg-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    Creating
                    <LoaderCircle size={15} className="animate-spin ml-2" />
                  </>
                ) : (
                  "Create Expense"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="bg-[#fa6161] hover:bg-[#fa6161]/90 text-white flex-items-center gap-2">
          <AppWindow size={16} />
          Add Expense
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl font-semibold">
            Add New Expense
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">{formContent}</div>
        <DrawerFooter>
          <Button
            type="submit"
            form="create-expense-form"
            className="bg-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                Creating
                <LoaderCircle size={15} className="animate-spin ml-2" />
              </>
            ) : (
              "Create Expense"
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
