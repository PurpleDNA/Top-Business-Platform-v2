"use client";

import { useState } from "react";
import { BreadPrice, updateBreadPrice } from "@/app/services/bread_price";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import { notify, messages, getErrorMessage } from "@/lib/notifications";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price: number;
  id: number;
  color: string;
  onSuccess: (updatedPrice: BreadPrice) => void;
}

export const EditBreadPriceModal = ({
  open,
  onOpenChange,
  price,
  onSuccess,
  color,
  id,
}: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    color: price,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (value: string) => {
    setFormData({ color: Number(value) });
    // Clear error when user starts typing
    if (errors[color]) {
      setErrors((prev) => ({ ...prev, [color]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.color || Number(formData.color) <= 0) {
      newErrors.color = "price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      notify.error(messages.generic.validation);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateBreadPrice(id, {
        price: Number(formData.color),
      });

      if (result.status !== "SUCCESS") {
        notify.error(getErrorMessage(result.error, messages.breadPrice.updateFailed));
        return;
      }

      notify.success(messages.breadPrice.updated);
      onSuccess(result.data);
    } catch (error) {
      notify.fromError(error, messages.breadPrice.updateFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Bread Price</DialogTitle>
          <DialogDescription>
            Update prices for all bread varieties. All prices are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor={color} className="text-sm font-medium mb-2 block">
                {color.toUpperCase()} Bread Price
              </label>
              <Input
                id={color}
                type="number"
                placeholder="Enter price"
                value={formData.color}
                onChange={(e) => handleChange(e.target.value)}
                className="no-spinners"
                disabled={isSubmitting}
              />
              {errors.orange && (
                <p className="text-xs text-destructive mt-1">{errors.orange}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Price"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
