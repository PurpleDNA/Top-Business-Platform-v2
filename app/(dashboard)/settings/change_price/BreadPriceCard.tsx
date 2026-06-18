"use client";

import { useState } from "react";
import { BreadPrice, deleteBreadPrice } from "@/app/services/bread_price";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EditBreadPriceModal } from "./EditBreadPriceModal";
import { DeleteBreadPriceDialog } from "./DeleteBreadPriceDialog";
import { notify, messages, getErrorMessage } from "@/lib/notifications";

interface Props {
  id: number;
  price: number;
  color: string;
  onUpdate: (updatedPrice: BreadPrice) => void;
  onDelete: (deletedId: number) => void;
  readOnly?: boolean;
}

export const BreadPriceCard = ({
  id,
  price,
  onUpdate,
  onDelete,
  color,
  readOnly,
}: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    const result = await deleteBreadPrice(id);
    if (result.status !== "SUCCESS") {
      const message = getErrorMessage(result.error, messages.breadPrice.deleteFailed);
      notify.error(message);
      // Re-throw so the confirm dialog knows the deletion failed.
      throw new Error(message);
    }
    notify.success(messages.breadPrice.deleted);
    onDelete(id);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Price Entry</CardTitle>
            {!readOnly && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div
              className={`flex justify-between items-center p-3 rounded-md bg-${color}-200 dark:bg-${color}-900/20`}
            >
              <span className="font-medium">{color}</span>
              <span className="font-bold">{price}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditBreadPriceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        price={price}
        color={color}
        id={id}
        onSuccess={(updatedPrice) => {
          onUpdate(updatedPrice);
          setIsEditModalOpen(false);
        }}
      />

      <DeleteBreadPriceDialog
        color={color}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
