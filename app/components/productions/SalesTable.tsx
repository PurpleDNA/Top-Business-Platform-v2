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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, User } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatNaira } from "@/app/services/utils";

interface SaleWithCustomer {
  id: string;
  amount: number;
  paid: boolean;
  outstanding: number;
  created_at: string;
  customer_id: string;
  production_id: string;
  customers: {
    id: string;
    name: string;
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const SalesTable = ({ sales }: { sales: SaleWithCustomer[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="hidden md:table-cell">Outstanding</TableHead>
          <TableHead className="hidden lg:table-cell">Status</TableHead>
          <TableHead className="hidden lg:table-cell">Date</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No sales recorded yet
            </TableCell>
          </TableRow>
        ) : (
          sales.map((sale) => (
            <TableRow
              key={sale.id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                (window.location.href = `/customers/page/${sale.customer_id}`)
              }
            >
              <TableCell className="font-medium">
                {sale.customers?.name || "Unknown"}
              </TableCell>
              <TableCell className="font-semibold">
                {formatNaira(sale.amount)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {sale.outstanding > 0 ? (
                  <span className="text-destructive font-medium">
                    {formatNaira(sale.outstanding)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">₦0</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge variant={sale.paid ? "default" : "destructive"}>
                  {sale.paid ? "Paid" : "Unpaid"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground hidden lg:table-cell">
                {formatDate(sale.created_at)}
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
                      <Link href={`/customers/page/${sale.customer_id}`}>
                        <User className="mr-2 h-4 w-4" />
                        View Customer
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/production/page/${sale.production_id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Production
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default SalesTable;
