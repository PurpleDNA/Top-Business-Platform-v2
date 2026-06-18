"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Production, updateProduction } from "@/app/services/productions";
import { getBreadPriceMultipliers } from "@/app/services/bread_price";
import { notify, notifyResult, messages } from "@/lib/notifications";
import { Loader2 } from "lucide-react";
import { getColorClasses } from "@/lib/utils";

interface EditProductionModalProps {
  production: Production;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProductionModal = ({
  production,
  open,
  onOpenChange,
}: EditProductionModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [multipliers, setMultipliers] = useState<Record<string, number>>({
    orange: 1200,
    blue: 1000,
    green: 650,
  });

  // Fetch multipliers on component mount
  useEffect(() => {
    const fetchMultipliers = async () => {
      const prices = await getBreadPriceMultipliers();
      setMultipliers(prices);
    };
    fetchMultipliers();
  }, []);

  // Initialize form data dynamically based on multipliers
  const initialFormData = useMemo(() => {
    const data: Record<string, string> = {};
    Object.keys(multipliers).forEach((color) => {
      data[`quantity_${color}`] = (production.quantity[color] || 0).toString();
      data[`old_bread_${color}`] = (
        production.old_bread[color] || 0
      ).toString();
    });
    data.cash = production.cash.toString();
    data.transfer = (production.transfer || 0).toString();
    return data;
  }, [multipliers, production]);

  const [formData, setFormData] = useState(initialFormData);

  // Update form data when production changes
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build quantity and old_bread dynamically from multipliers
      const quantity: { [key: string]: number } & {
        orange: number;
        blue: number;
        green: number;
      } = {
        orange: 0,
        blue: 0,
        green: 0,
      };

      const old_bread: { [key: string]: number } & {
        orange: number;
        blue: number;
        green: number;
      } = {
        orange: 0,
        blue: 0,
        green: 0,
      };

      Object.keys(multipliers).forEach((color) => {
        quantity[color] = Number(formData[`quantity_${color}`] || 0);
        old_bread[color] = Number(formData[`old_bread_${color}`] || 0);
      });

      // Don't include remaining_bread in the payload - it's calculated on frontend
      const payload = {
        quantity,
        old_bread,
        cash: Number(formData.cash),
        transfer: Number(formData.transfer),
      };

      const result = await updateProduction(production.id, payload);

      if (notifyResult(result, { success: messages.production.updated, error: messages.production.updateFailed })) {
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      notify.fromError(error, messages.production.updateFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Production</DialogTitle>
          <DialogDescription>
            Update production quantities, old bread, cash collected, and
            transfer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Quantity Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Production Quantity</h4>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(multipliers).map((color) => {
                  const colorClasses = getColorClasses(color);
                  return (
                    <div key={`quantity_${color}`} className="grid gap-2">
                      <Label
                        htmlFor={`quantity_${color}`}
                        className="text-xs capitalize"
                      >
                        {color}
                      </Label>
                      <Input
                        id={`quantity_${color}`}
                        type="number"
                        value={formData[`quantity_${color}`] || ""}
                        onChange={(e) =>
                          handleFieldChange(`quantity_${color}`, e.target.value)
                        }
                        className={`${colorClasses.bg} ${colorClasses.darkBg} text-foreground`}
                        required
                        min="0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Old Bread Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Old Bread</h4>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(multipliers).map((color) => {
                  const colorClasses = getColorClasses(color);
                  return (
                    <div key={`old_bread_${color}`} className="grid gap-2">
                      <Label
                        htmlFor={`old_bread_${color}`}
                        className="text-xs capitalize"
                      >
                        {color}
                      </Label>
                      <Input
                        id={`old_bread_${color}`}
                        type="number"
                        value={formData[`old_bread_${color}`] || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            `old_bread_${color}`,
                            e.target.value
                          )
                        }
                        className={`${colorClasses.bg} ${colorClasses.darkBg} text-foreground opacity-75`}
                        required
                        min="0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cash & Transfer Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cash">Cash Collected (₦)</Label>
                <Input
                  id="cash"
                  type="number"
                  value={formData.cash}
                  onChange={(e) => handleFieldChange("cash", e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transfer">Transfer (₦)</Label>
                <Input
                  id="transfer"
                  type="number"
                  value={formData.transfer}
                  onChange={(e) => handleFieldChange("transfer", e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row ">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-1/2">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
