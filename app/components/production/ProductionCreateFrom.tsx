/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useActionState, useState, useMemo } from "react";
import { createProduction } from "@/app/services/productions";
import z from "zod";
import { notify, messages } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getColorClasses } from "@/lib/utils";

const validateCreate = z.object({
  quantity: z.record(z.string(), z.coerce.number()).refine(
    (data) => {
      // Check if at least one property has a truthy (non-NaN, >0) value
      return Object.values(data).some(
        (val) => val !== undefined && val !== 0 && !isNaN(val)
      );
    },
    {
      message: "You must input at least one value",
      path: ["quantity"], // put error at the object level
    }
  ),
  total: z.coerce.number().min(1, "total is required"),
  old_bread: z.record(z.string(), z.coerce.number().optional()).optional(),
  bread_price: z.record(z.string(), z.coerce.number()),
});

interface Props {
  multipliers: Record<string, number>;
}
const ProductionFrom = ({ multipliers }: Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOldBread, setShowOldBread] = useState(false);


  // Initialize state dynamically based on multipliers
  const initialQuantity = useMemo(() => {
    const obj: Record<string, string> = {};
    Object.keys(multipliers).forEach((color) => {
      obj[color] = "";
    });
    return obj;
  }, [multipliers]);

  const [payload, setPayload] = useState({
    quantity: initialQuantity,
    total: "",
    old_bread: { ...initialQuantity },
    bread_price: multipliers,
  });

  function handleQuantityChange(name: string, value: string) {
    setPayload((prev) => {
      const updatedQuantity = {
        ...prev.quantity,
        [name]: value,
      };

      // sum all (quantities + old_bread) × multipliers
      const total = Object.keys(multipliers).reduce((sum, color) => {
        const quantity = Number(updatedQuantity[color] || 0);
        const oldBread = Number(prev.old_bread[color] || 0);
        const multiplier = multipliers[color] || 0;
        return sum + (quantity + oldBread) * multiplier;
      }, 0);

      return {
        ...prev,
        quantity: updatedQuantity,
        total: String(total),
      };
    });
  }

  function handleOldBreadChange(name: string, value: string) {
    setPayload((prev) => {
      const updatedOldBread = {
        ...prev.old_bread,
        [name]: value,
      };

      // sum all (quantities + old_bread) × multipliers
      const total = Object.keys(multipliers).reduce((sum, color) => {
        const quantity = Number(prev.quantity[color] || 0);
        const oldBread = Number(updatedOldBread[color] || 0);
        const multiplier = multipliers[color] || 0;
        return sum + (quantity + oldBread) * multiplier;
      }, 0);

      return {
        ...prev,
        old_bread: updatedOldBread,
        total: String(total),
      };
    });
  }

  async function handleSubmit(prevState: any, formData: FormData) {
    // Dynamically build quantity and old_bread from multipliers
    const quantity: Record<string, string> = {};
    const old_bread: Record<string, string> = {};

    Object.keys(multipliers).forEach((color) => {
      quantity[color] = String(formData.get(color) || "");
      old_bread[color] = String(formData.get(`old_bread_${color}`) || "");
    });

    const values = {
      quantity,
      total: formData.get("total") as string,
      old_bread,
      bread_price: multipliers,
    };

    setErrors({});

    try {
      await validateCreate.parseAsync(values);
      const response = await createProduction(payload);
      if (response.status === "SUCCESS") {
        notify.success(messages.production.created);
        setPayload({
          quantity: { ...initialQuantity },
          total: "",
          old_bread: { ...initialQuantity },
          bread_price: multipliers,
        });
        setShowOldBread(false);
      } else {
        notify.error(messages.production.createFailed);
      }
      return response;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as unknown as Record<string, string>);
        notify.error(messages.generic.validation);
        return { status: "ERROR", error: fieldErrors };
      }
      notify.fromError(error, messages.production.createFailed);
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, {
    status: "",
    error: "",
  });

  return (
    <form action={formAction} className="flex flex-col gap-4 items-center my-5">
      <div className="w-full">
        <div className="flex justify-around items-center">
          {Object.keys(multipliers).map((color) => {
            return (
              <div key={color} className="flex flex-col items-center gap-1">
                <span className="text-sm capitalize">{color}</span>
                <Input
                  className={`w-[60px] h-[60px] ${getColorClasses(color).bg} ${
                    getColorClasses(color).darkBg
                  } text-center no-spinners`}
                  name={color}
                  type="number"
                  onChange={(e) =>
                    handleQuantityChange(e.target.name, e.target.value)
                  }
                  value={payload.quantity[color] || ""}
                />
              </div>
            );
          })}
        </div>
        {errors.quantity && (
          <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
        )}
      </div>

      <div className="w-full">
        <label htmlFor="total" className="mb-1 text-sm">
          Production Total
        </label>
        <Input
          type="number"
          placeholder="total"
          name="total"
          className="w-full mt-1 no-spinners font-bold"
          readOnly
          value={`${payload.total}`}
        />

        {errors.total && (
          <p className="text-red-500 text-xs mt-1">{errors.total}</p>
        )}
      </div>

      {/* Old Bread Quantity Inputs */}
      {showOldBread && (
        <div className="w-full animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-around items-center">
            {Object.keys(multipliers).map((color) => {
              return (
                <div key={color} className="flex flex-col items-center gap-1">
                  <span className="text-sm capitalize">{color}</span>
                  <Input
                    className={`w-[60px] h-[60px] ${
                      getColorClasses(color).bg
                    } ${
                      getColorClasses(color).darkBg
                    } text-center no-spinners opacity-75`}
                    name={`old_bread_${color}`}
                    type="number"
                    onChange={(e) =>
                      handleOldBreadChange(
                        e.target.name.replace("old_bread_", ""),
                        e.target.value
                      )
                    }
                    value={payload.old_bread[color] || ""}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Old Bread Toggle */}
      <div className="w-full flex items-center justify-between border rounded-lg p-3 bg-muted/50">
        <Label htmlFor="old-bread-toggle" className="text-sm font-medium">
          Old Bread
        </Label>
        <Switch
          id="old-bread-toggle"
          checked={showOldBread}
          onCheckedChange={() => {
            setShowOldBread((prev) => !prev);
            setPayload((prev) => ({
              ...prev,
              old_bread: { ...initialQuantity },
            }));
          }}
        />
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

export default ProductionFrom;
