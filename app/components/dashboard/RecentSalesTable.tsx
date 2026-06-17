"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { SaleWithDetails } from "@/app/services/sales";
import { getBadgeColorClasses } from "@/lib/utils";
import { formatNaira } from "@/app/services/utils";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const RecentSalesTable = ({ sales }: { sales: SaleWithDetails[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/4">Date</TableHead>
          <TableHead className="w-1/4">Customer</TableHead>
          <TableHead className="w-1/4">Quantities</TableHead>
          <TableHead className="w-1/4 text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow
            key={sale.id}
            className="hover:bg-muted/50 cursor-pointer group"
            onClick={() =>
              (window.location.href = `/customers/page/${sale.customer_id}`)
            }
          >
            <TableCell className="text-muted-foreground text-sm py-4">
              {formatDate(sale.created_at)}
            </TableCell>
            <TableCell className="font-medium">
              {sale.customers?.name || "Unknown"}
            </TableCell>
            <TableCell>
              <div className="flex gap-1.5 flex-wrap justify-center lg:justify-start">
                {Object.entries(sale.quantity_bought || {}).map(
                  ([type, qty]) => {
                    if (qty === 0) return null;
                    return (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={`${getBadgeColorClasses(
                          type
                        )} text-[10px] px-1.5 py-0 h-5`}
                      >
                        {type.charAt(0).toUpperCase()}: {qty}
                      </Badge>
                    );
                  }
                )}
              </div>
            </TableCell>
            <TableCell className="text-right py-4">
              <div className="flex flex-col items-end">
                <span className="font-semibold text-foreground">
                  {formatNaira(sale.amount)}
                </span>
                {sale.remaining > 0 ? (
                  <span className="text-[10px] font-medium text-destructive mt-0.5">
                    Bal: {formatNaira(sale.remaining)}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-primary mt-0.5">
                    Paid
                  </span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RecentSalesTable;
