"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, RotateCcw } from "lucide-react";
import { formatNaira, formatNumber } from "@/app/services/utils";

interface Props {
  multipliers: Record<string, number>;
}

export const BreadCalculatorComponent = ({ multipliers }: Props) => {
  // Color mapping for Tailwind classes (Tailwind requires complete class strings)
  const colorClasses: Record<string, string> = {
    orange: "bg-orange-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    white: "bg-white-500",
  };

  const [quantity, setQuantity] = useState<{
    [key: string]: number | undefined;
  }>(() => {
    const initialQty: Record<string, number | undefined> = {};
    Object.keys(multipliers).forEach((color) => {
      initialQty[color] = undefined;
    });
    return initialQty;
  });

  const [total, setTotal] = useState<number>();

  const handleQuantityChange = (name: string, value: string) => {
    const num = value === "" ? undefined : Number(value);

    setQuantity((prevQty) => {
      const updatedQty = {
        ...prevQty,
        [name]: num,
      };

      const calculatedTotal = Object.entries(updatedQty).reduce(
        (sum, [key, val]) => {
          const multiplier = multipliers[key] || 0;
          return sum + Number(val || 0) * multiplier;
        },
        0
      );

      setTotal(calculatedTotal);
      return updatedQty;
    });
  };

  const handleReset = () => {
    const resetQty: Record<string, number | undefined> = {};
    Object.keys(multipliers).forEach((color) => {
      resetQty[color] = undefined;
    });
    setQuantity(resetQty);
    setTotal(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculate Total
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bread Type Inputs */}
        <div className="flex justify-around items-center">
          {Object.entries(multipliers).map(([color, price]) => (
            <div key={color} className="flex flex-col items-center gap-2">
              <span className="text-sm text-muted-foreground capitalize">
                {color}
              </span>
              <Input
                className={`w-[80px] h-[80px] ${
                  colorClasses[color] || "bg-gray-500"
                } text-center no-spinners text-xl font-semibold`}
                name={color}
                type="number"
                value={quantity[color] === undefined ? "" : quantity[color]}
                onChange={(e) =>
                  handleQuantityChange(e.target.name, e.target.value)
                }
              />
              <span className="text-xs text-muted-foreground">
                {formatNaira(price)} each
              </span>
            </div>
          ))}
        </div>

        {/* Total Display */}
        <div className="p-6 rounded-lg bg-primary/10 border-2 border-primary">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-foreground">
              {formatNaira(total)}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        {total !== undefined && total > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Breakdown:</p>
            {Object.entries(quantity).map(([key, val]) => {
              if (!val || val === 0) return null;
              const amount = val * (multipliers[key] || 0);
              return (
                <div
                  key={key}
                  className="flex justify-between text-sm text-muted-foreground"
                >
                  <span className="capitalize">
                    {key}: {val} × ₦{formatNumber(multipliers[key])}
                  </span>
                  <span className="font-medium">
                    {formatNaira(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Reset Button */}
        <Button variant="outline" className="w-full" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Calculator
        </Button>
      </CardContent>
    </Card>
  );
};
