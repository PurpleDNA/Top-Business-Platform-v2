"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { getColorClasses as getColorClass } from "@/lib/utils";
import { getSortedBreadItems } from "@/lib/utils";
import { formatNaira, formatNumber } from "@/app/services/utils";

interface RemainingBreadDropdownProps {
  remainingBreadTotal: number;
  remainingBread: {
    orange: number;
    blue: number;
    green: number;
    [key: string]: number;
  };
  multipliers: Record<string, number>;
}

export const RemainingBreadDropdown = ({
  remainingBreadTotal,
  remainingBread,
  multipliers,
}: RemainingBreadDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Convert remaining_bread object to array for easier display and filter zero quantities
  const breadItems = getSortedBreadItems(remainingBread, multipliers);

  // Calculate total units
  const totalUnits = breadItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-lg font-semibold">Remaining Bread</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatNaira(remainingBreadTotal)}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {breadItems.length === 0 || totalUnits === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No remaining bread</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {breadItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 border"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          getColorClass(item.color).bg
                        }`}
                      ></div>
                      <span className="font-medium capitalize">
                        {item.color}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {formatNumber(item.quantity)} units
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="font-semibold text-sm">Total Value</span>
                  <span className="font-bold text-lg">
                    {formatNaira(remainingBreadTotal)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};
