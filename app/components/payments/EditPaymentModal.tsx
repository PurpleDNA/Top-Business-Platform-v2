"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePayment, Payment } from "@/app/services/payments";
import { fetchSaleById } from "@/app/services/sales";
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

interface EditPaymentModalProps {
  payment: {
    id: string | number;
    amount: number;
    type: string;
    sale_id?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPaymentModal = ({
  payment,
  open,
  onOpenChange,
}: EditPaymentModalProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(payment.amount.toString());
  const [remainingAmount, setRemainingAmount] = useState<number | null>(null);
  const [saleAmount, setSaleAmount] = useState<number | null>(null);

  useEffect(() => {
    const loadSaleDetails = async () => {
      if (payment.sale_id) {
        const sale = await fetchSaleById(payment.sale_id);
        if (sale) {
          setRemainingAmount(sale.remaining);
          setSaleAmount(sale.amount);
        }
      }
    };
    loadSaleDetails();
  }, [payment.sale_id]);

  const isOverpaid =
    saleAmount !== null && Number(amount) > saleAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountPaid = Number(amount);

      if (isNaN(amountPaid) || amountPaid <= 0) {
        notify.error(messages.payment.invalidAmount);
        setLoading(false);
        return;
      }

      const result = await updatePayment(String(payment.id), { amountPaid });

      if (notifyResult(result, { success: messages.payment.updated, error: messages.payment.updateFailed })) {
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      notify.fromError(error, messages.payment.updateFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            { (saleAmount !== null && remainingAmount !== null) && 
            (<div className="flex justify-between gap-3">
              <div className="space-y-2">

              <Label htmlFor="sale_amount">Sale Amount</Label>
              <Input
                id="sale_amount"
                type="number"
                value={saleAmount}
                readOnly
                className="bg-muted"
              />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_amount">Remaining Amount</Label>
                <Input
                  id="sale_amount"
                  type="number"
                  value={remainingAmount}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>)}
            <Label htmlFor="amount">Payment Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter payment amount"
              required
            />
            {isOverpaid && (
              <p className="text-sm text-red-500">
                Payment amount cannot exceed sale amount
              </p>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Payment Type:{" "}
              <span className="font-semibold capitalize">{payment.type}</span>
            </p>
            <p className="text-xs mt-1">
              {payment.type === "after"
                ? "This payment is distributed across multiple sales"
                : "This payment is linked to a specific sale"}
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
              disabled={loading || isOverpaid}
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
