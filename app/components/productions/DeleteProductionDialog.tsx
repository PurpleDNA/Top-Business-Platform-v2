"use client";

import { useState } from "react";
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
import { notify, notifyResult, messages } from "@/lib/notifications";
import { Loader2, AlertTriangle } from "lucide-react";
import { deleteProduction } from "@/app/services/productions";

interface DeleteProductionDialogProps {
  productionId: string;
  productionDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectOnDelete?: boolean;
}

export const DeleteProductionDialog = ({
  productionId,
  productionDate,
  open,
  onOpenChange,
  redirectOnDelete = false,
}: DeleteProductionDialogProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const result = await deleteProduction(productionId);

      if (notifyResult(result, { success: messages.production.deleted, error: messages.production.deleteFailed })) {
        onOpenChange(false);

        if (redirectOnDelete) {
          router.push("/productions/all");
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      notify.fromError(error, messages.production.deleteFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Production</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            Are you sure you want to delete the production from{" "}
            <span className="font-semibold text-foreground">
              {productionDate}
            </span>
            ? This action cannot be undone. All associated sales, expenses, and
            data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Production
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
