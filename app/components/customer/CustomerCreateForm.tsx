/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createCustomer } from "@/app/services/customers";
import React, { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import z from "zod";
import { notify, messages } from "@/lib/notifications";

const validateCreate = z
  .object({
    name: z.string().min(1, "Name is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^[0-9]+$/, "Phone number must contain only digits"),
    hasDebt: z.boolean(),
    debtAmount: z.coerce.number().optional(), // make it optional at base level
  })
  .refine(
    (data) => {
      // only valid if hasDebt is false OR debtAmount is given
      if (data.hasDebt) {
        return data.debtAmount !== undefined && data.debtAmount > 0;
      }
      return true;
    },
    {
      message: "Debt amount is required",
      path: ["debtAmount"], // attach error to the field
    }
  );

const CustomerCreateForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payload, setPayload] = useState({
    name: "",
    phoneNumber: "",
    hasDebt: false,
    debtAmount: "",
  });

  async function handleSubmit(prevState: any, formData: FormData) {
    // const formData = new FormData();
    // formData.append("name", payload.name);
    // formData.append("phoneNumber", payload.phoneNumber);
    // formData.append("hasDebt", payload.hasDebt.toString());
    // formData.append("debtAmount", payload.debtAmount.toString());

    const values = {
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      hasDebt: payload.hasDebt,
      debtAmount: formData.get("debtAmount"),
    };

    setErrors({});

    try {
      await validateCreate.parseAsync(values);
      const response = await createCustomer(payload);

      if (response.status === "SUCCESS") {
        notify.success(messages.customer.created);
        // Reset form after successful submission
        setPayload({
          name: "",
          phoneNumber: "",
          hasDebt: false,
          debtAmount: "",
        });
      } else {
        notify.error(messages.customer.createFailed);
      }
      return response;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as unknown as Record<string, string>);
        notify.error(messages.generic.validation);
        return { status: "ERROR", error: fieldErrors };
      } else {
        notify.fromError(error, messages.customer.createFailed);
      }
    }
  }
  const [state, formAction, isPending] = useActionState(handleSubmit, {
    status: "",
    error: "",
  });

  return (
    <form action={formAction} className="flex flex-col gap-4 items-center my-5">
      <div className="w-full">
        <label htmlFor="name" className="text-sm">
          Name
        </label>
        <Input
          type="text"
          placeholder="customer name"
          name="name"
          className="w-full mt-1 py-6 rounded-lg"
          onChange={(e) =>
            setPayload((prev) => ({ ...prev, name: e.target.value }))
          }
          value={payload.name}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>
      <div className="w-full">
        <label htmlFor="phoneNumber" className="mb-1 text-sm">
          Phone Number
        </label>
        <Input
          type="text"
          placeholder="customer phone number"
          name="phoneNumber"
          className="w-full mt-1"
          onChange={(e) =>
            setPayload((prev) => ({ ...prev, phoneNumber: e.target.value }))
          }
          value={payload.phoneNumber}
        />
        {errors.phoneNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
        )}
      </div>
      <div className="mr-auto">
        <label htmlFor="hasDebt" className="text-sm">
          Does Customer have debt?
        </label>
        <Input
          type="checkbox"
          name="hasDebt"
          className="h-8 w-8 mt-1"
          onChange={(e) =>
            setPayload((prev) => ({ ...prev, hasDebt: e.target.checked }))
          }
          checked={payload.hasDebt}
        />
        {errors.hasDebt && (
          <p className="text-red-500 text-xs mt-1">{errors.hasDebt}</p>
        )}
      </div>
      {payload.hasDebt && (
        <div className="w-full transition-all animate-collapsible-down">
          <label htmlFor="debtAmount" className="text-sm">
            Debt Amount
          </label>
          <Input
            type="number"
            placeholder="amount"
            name="debtAmount"
            className="w-full mt-1 no-spinners"
            onChange={(e) =>
              setPayload((prev) => ({
                ...prev,
                debtAmount: e.target.value,
              }))
            }
            value={payload.hasDebt ? payload.debtAmount : 0}
          />
          {errors.debtAmount && (
            <p className="text-red-500 text-xs mt-1">{errors.debtAmount}</p>
          )}
        </div>
      )}
      <Button
        className="bg-primary  cursor-pointer"
        disabled={isPending}
        type="submit"
      >
        Create{isPending && <LoaderCircle size={15} className="animate-spin" />}
      </Button>
    </form>
  );
};

export default CustomerCreateForm;
