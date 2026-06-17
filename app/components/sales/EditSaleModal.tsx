import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateSale, Sale } from "@/app/services/sales";
import { getBreadPriceMultipliers } from "@/app/services/bread_price";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify, notifyResult, messages } from "@/lib/notifications";
import { Loader2 } from "lucide-react";
import { getColorClasses } from "@/lib/utils";

interface EditSaleModalProps {
  sale: {
    id: string;
    amount: number;
    amount_paid: number;
    outstanding: number;
    quantity_bought: { [key: string]: number };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSaleModal = ({
  sale,
  open,
  onOpenChange,
}: EditSaleModalProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    amount: sale.amount.toString(),
    amount_paid: sale.amount_paid.toString(),
  });
  const [quantity, setQuantity] = useState<{ [key: string]: string }>({});

  // Fetch multipliers on mount and initialize quantity
  useEffect(() => {
    const fetchMultipliers = async () => {
      const prices = await getBreadPriceMultipliers();
      setMultipliers(prices);

      // Initialize quantity from sale data or default to 0 for available colors
      const initialQuantity: { [key: string]: string } = {};
      Object.keys(prices).forEach((color) => {
        initialQuantity[color] = (
          sale.quantity_bought?.[color] || 0
        ).toString();
      });
      setQuantity(initialQuantity);
    };
    fetchMultipliers();
  }, [sale]);

  const handleQuantityChange = (name: string, value: string) => {
    // Update quantity state
    const updatedQty = {
      ...quantity,
      [name]: value,
    };
    setQuantity(updatedQty);

    // Calculate new total amount
    let total = 0;
    Object.entries(updatedQty).forEach(([key, val]) => {
      const multiplier = multipliers[key] || 0;
      total += Number(val || 0) * multiplier;
    });

    setFormData((prev) => ({ ...prev, amount: total.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = Number(formData.amount);
      const amountPaid = Number(formData.amount_paid);

      if (isNaN(amount) || amount <= 0) {
        notify.error(messages.sale.invalidAmount);
        setLoading(false);
        return;
      }

      if (isNaN(amountPaid) || amountPaid < 0) {
        notify.error(messages.sale.invalidAmountPaid);
        setLoading(false);
        return;
      }

      if (amountPaid > amount) {
        notify.error(messages.sale.overpayment);
        setLoading(false);
        return;
      }

      const quantityPayload: { [key: string]: number } = {};
      Object.entries(quantity).forEach(([key, value]) => {
        quantityPayload[key] = Number(value);
      });

      const payload: Partial<Sale> = {
        amount,
        amount_paid: amountPaid,
        outstanding: amount - amountPaid,
        paid: amountPaid >= amount,
        quantity_bought: quantityPayload,
      };

      const result = await updateSale(sale.id, payload);

      if (notifyResult(result, { success: messages.sale.updated, error: messages.sale.updateFailed })) {
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      notify.fromError(error, messages.sale.updateFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-around items-center">
              {Object.keys(multipliers).map((color) => {
                const colorClasses = getColorClasses(color);
                return (
                  <div key={color} className="flex flex-col items-center gap-1">
                    <span className="text-sm capitalize">{color}</span>
                    <Input
                      className={`w-[60px] h-[60px] ${colorClasses.bg} text-center no-spinners ${colorClasses.darkBg}`}
                      name={color}
                      type="number"
                      value={quantity[color] || ""}
                      onChange={(e) =>
                        handleQuantityChange(e.target.name, e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_paid">Amount Paid</Label>
            <Input
              id="amount_paid"
              type="number"
              value={formData.amount_paid}
              onChange={(e) =>
                setFormData({ ...formData, amount_paid: e.target.value })
              }
              placeholder="Enter amount paid"
              required
            />
            {Number(formData.amount_paid) > Number(formData.amount) && (
              <p className="text-sm text-red-500">
                Amount paid cannot exceed total amount
              </p>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Outstanding:{" "}
              <span className="font-semibold">
                ₦
                {(
                  Number(formData.amount) - Number(formData.amount_paid)
                ).toLocaleString()}
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                Number(formData.amount_paid) > Number(formData.amount)
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
