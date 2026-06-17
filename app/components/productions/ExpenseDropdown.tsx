"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Expense } from "@/app/services/expenses";
import { formatNaira } from "@/app/services/utils";

interface ExpenseDropdownProps {
  data: Expense[];
  itemsPerPage?: number;
}

export const ExpenseDropdown = ({
  data,
  itemsPerPage = 10,
}: ExpenseDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  // Calculate total amount
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-lg font-semibold">Expenses</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatNaira(totalAmount)}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses recorded</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {currentItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 border"
                  >
                    <span className="font-medium">{item.expense}</span>
                    <span className="font-semibold">
                      {formatNaira(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
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
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="font-semibold text-sm">Total Expenses</span>
                  <span className="font-bold text-lg">
                    {formatNaira(totalAmount)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};
