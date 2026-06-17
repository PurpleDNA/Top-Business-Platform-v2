"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Production } from "@/app/services/productions";
import Link from "next/link";
import { EditProductionModal } from "@/app/components/productions/EditProductionModal";
import { DeleteProductionDialog } from "@/app/components/productions/DeleteProductionDialog";
import { getBadgeColorClasses } from "@/lib/utils";
import { formatNaira } from "@/app/services/utils";
import { useIsMobile } from "@/app/hooks/use-mobile";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const RecentProductionsTable = ({
  productions,
}: {
  productions: Production[];
}) => {
  const [editingProduction, setEditingProduction] = useState<Production | null>(
    null
  );
  const [deletingProduction, setDeletingProduction] = useState<{
    id: string;
    date: string;
  } | null>(null);
  const isMobile = useIsMobile();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Quantities</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productions.map((production) => (
            <TableRow
              key={production.id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                (window.location.href = `/production/page/${production.id}`)
              }
            >
              <TableCell className="font-medium">
                {isMobile
                  ? formatDate(production.created_at).slice(0, 6)
                  : formatDate(production.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
                  {Object.keys(production.bread_price || {}).map((breadType) => {
                    const totalQuantity =
                      (production.quantity?.[breadType] || 0) +
                      (production.old_bread?.[breadType] || 0);
                    if (totalQuantity === 0) return null;

                    return (
                      <Badge
                        key={breadType}
                        variant="secondary"
                        className={`${getBadgeColorClasses(
                          breadType
                        )} text-[10px] px-1.5 py-0 h-5`}
                      >
                        {breadType.charAt(0).toUpperCase()}: {totalQuantity}
                      </Badge>
                    );
                  })}
                </div>
              </TableCell>
              <TableCell className="font-semibold">
                {formatNaira(production.total)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem asChild>
                      <Link href={`/production/page/${production.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduction(production);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Production
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProduction({
                          id: production.id,
                          date: formatDate(production.created_at),
                        });
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingProduction && (
        <EditProductionModal
          production={editingProduction}
          open={!!editingProduction}
          onOpenChange={(open) => !open && setEditingProduction(null)}
        />
      )}

      {deletingProduction && (
        <DeleteProductionDialog
          productionId={deletingProduction.id}
          productionDate={deletingProduction.date}
          open={!!deletingProduction}
          onOpenChange={(open) => !open && setDeletingProduction(null)}
        />
      )}
    </>
  );
};

export default RecentProductionsTable;
