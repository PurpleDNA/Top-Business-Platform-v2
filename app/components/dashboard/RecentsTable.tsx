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
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/app/services/customers";
import Link from "next/link";
import { EditCustomerModal } from "@/app/components/customer/EditCustomerModal";
import { DeleteCustomerDialog } from "@/app/components/customer/DeleteCustomerDialog";
import { formatNaira } from "@/app/services/utils";

const getStatusVariant = (hasDebt: boolean, totalDebt: number) => {
  if (!hasDebt || totalDebt === 0) {
    return "default";
  }
  if (totalDebt > 10000) {
    return "destructive";
  }
  return "secondary";
};

const getStatusText = (hasDebt: boolean, totalDebt: number) => {
  if (!hasDebt || totalDebt === 0) {
    return "Debt Free";
  }
  if (totalDebt > 10000) {
    return "High Debt";
  }
  return "Active";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const RecentsTable = ({ customers }: { customers: Customer[] }) => {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden lg:table-cell">Phone</TableHead>
            <TableHead className="hidden lg:table-cell">Debt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                (window.location.href = `/customers/page/${customer.id}`)
              }
            >
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell className="text-muted-foreground hidden lg:table-cell">
                {customer.phone_number}
              </TableCell>
              <TableCell className="font-semibold hidden lg:table-cell">
                {formatNaira(customer.total_debt)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={getStatusVariant(
                    customer.has_debt,
                    customer.total_debt
                  )}
                >
                  {getStatusText(customer.has_debt, customer.total_debt)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground hidden lg:table-cell">
                {formatDate(customer.created_at)}
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
                      <Link href={`/customers/page/${customer.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustomer(customer);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Customer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCustomer({
                          id: customer.id,
                          name: customer.name,
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

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
        />
      )}

      {deletingCustomer && (
        <DeleteCustomerDialog
          customerId={deletingCustomer.id}
          customerName={deletingCustomer.name}
          open={!!deletingCustomer}
          onOpenChange={(open) => !open && setDeletingCustomer(null)}
        />
      )}
    </>
  );
};

export default RecentsTable;
