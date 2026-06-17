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
import { deleteSale } from "@/app/services/sales";

interface DeleteSaleDialogProps {
  saleId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectOnDelete?: boolean;
}

export const DeleteSaleDialog = ({
  saleId,
  customerName,
  open,
  onOpenChange,
  redirectOnDelete = false,
}: DeleteSaleDialogProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteSale(saleId);

      if (notifyResult(result, { success: messages.sale.deleted, error: messages.sale.deleteFailed })) {
        onOpenChange(false);

        if (redirectOnDelete) {
          router.push("/sales/all");
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      notify.fromError(error, messages.sale.deleteFailed);
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
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete the sale for{" "}
            <span className="font-semibold">{customerName}</span>? This action
            cannot be undone and will affect outstanding balances.
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
