"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { notify, notifyResult, messages } from "@/lib/notifications";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deletePayment } from "@/app/services/payments";
import { formatNaira } from "@/app/services/utils";

interface DeletePaymentDialogProps {
  paymentId: string | number;
  customerName: string;
  amount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectOnDelete?: boolean;
}

export const DeletePaymentDialog = ({
  paymentId,
  customerName,
  amount,
  open,
  onOpenChange,
  redirectOnDelete = false,
}: DeletePaymentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deletePayment(String(paymentId));

      if (notifyResult(result, { success: messages.payment.deleted, error: messages.payment.deleteFailed })) {
        onOpenChange(false);

        if (redirectOnDelete) {
          router.push("/payments/all");
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      notify.fromError(error, messages.payment.deleteFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete the payment of{" "}
            <span className="font-semibold">{formatNaira(amount)}</span>{" "}
            for <span className="font-semibold">{customerName}</span>? This
            action cannot be undone and will reverse the payment effects on
            sales.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
