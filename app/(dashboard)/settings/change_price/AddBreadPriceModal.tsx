"use client";

import { useState } from "react";
import { BreadPrice, createBreadPrice } from "@/app/services/bread_price";
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
  onSuccess: (newPrice: BreadPrice) => void;
}

export const AddBreadPriceModal = ({ open, onOpenChange, onSuccess }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    color: "",
    price: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.color || formData.color.trim() === "") {
      newErrors.color = "Color is required";
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
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
      const result = await createBreadPrice({
        color: formData.color,
        price: Number(formData.price),
      });

      if (result.status !== "SUCCESS") {
        notify.error(getErrorMessage(result.error, messages.breadPrice.addFailed));
        return;
      }

      notify.success(messages.breadPrice.added);
      onSuccess(result.data);

      // Reset form
      setFormData({ color: "", price: "" });
      setErrors({});
    } catch (error) {
      notify.fromError(error, messages.breadPrice.addFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ color: "", price: "" });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Bread Price</DialogTitle>
          <DialogDescription>
            Set the color and price for a new bread variety.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="color" className="text-sm font-medium mb-2 block">
                Bread Color
              </label>
              <Input
                id="color"
                type="text"
                placeholder="Enter color (e.g., orange, blue, green)"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                disabled={isSubmitting}
              />
              {errors.color && (
                <p className="text-xs text-destructive mt-1">{errors.color}</p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="text-sm font-medium mb-2 block">
                Price
              </label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className="no-spinners"
                disabled={isSubmitting}
              />
              {errors.price && (
                <p className="text-xs text-destructive mt-1">{errors.price}</p>
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
                  Adding...
                </>
              ) : (
                "Add Price"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
