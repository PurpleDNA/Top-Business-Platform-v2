"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Production } from "@/app/services/productions";
import { useState } from "react";
import { EditProductionModal } from "@/app/components/productions/EditProductionModal";
import { DeleteProductionDialog } from "@/app/components/productions/DeleteProductionDialog";
import { getBadgeColorClasses } from "@/lib/utils";
import { formatNaira } from "@/app/services/utils";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ProductionsTable = ({ productions }: { productions: Production[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduction, setEditingProduction] = useState<Production | null>(
    null
  );
  const [deletingProduction, setDeletingProduction] = useState<{
    id: string;
    date: string;
  } | null>(null);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(productions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProductions = productions.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <>
      <div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Quantities</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProductions.map((production) => (
                <TableRow
                  key={production.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/production/page/${production.id}`)
                  }
                >
                  <TableCell className="font-medium">
                    {formatDate(production.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(production.quantity || {}).map(
                        ([breadType, qty]) => {
                          const totalQuantity =
                            (qty || 0) + (production.old_bread?.[breadType] || 0);
                          if (totalQuantity === 0) return null;

                          return (
                            <Badge
                              key={breadType}
                              variant="secondary"
                              className={getBadgeColorClasses(breadType)}
                            >
                              {breadType.charAt(0).toUpperCase()}:{" "}
                              {totalQuantity}
                            </Badge>
                          );
                        }
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatNaira(production.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduction(production);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProduction({
                            id: production.id,
                            date: formatDate(production.created_at),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, productions.length)} of {productions.length}{" "}
              productions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

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

export default ProductionsTable;
