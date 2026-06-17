"use client";

import { useState } from "react";
import {
  DollarSign,
  Wallet,
  AlertTriangle,
  Package,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatNaira, formatNumber } from "@/app/services/utils";

interface FinancialSummaryProps {
  cash: number;
  totalExpenses: number;
  totalOutstanding: number;
  remainingBreadTotal: number;
  totalPaidOutstanding: number;
  adjustedTotal: number;
  total: number;
  difference: number;
  isBalanced: boolean;
  isShort: boolean;
}

export const FinancialSummary = ({
  cash,
  totalExpenses,
  totalOutstanding,
  remainingBreadTotal,
  totalPaidOutstanding,
  adjustedTotal,
  total,
  difference,
  isBalanced,
  isShort,
}: FinancialSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Financial Summary
          </h2>
          <p className="text-xs text-muted-foreground">
            Production financials overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-base font-bold ${
              isBalanced
                ? "text-blue-400"
                : isShort
                  ? "text-red-400"
                  : "text-green-400"
            }`}
          >
            {isBalanced
              ? "₦0"
              : `${isShort ? "-" : "+"}₦${formatNumber(Math.abs(difference))}`}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 mt-4">
          {/* Cash Collected */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-foreground">Cash Collected</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatNaira(cash)}
            </span>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-foreground">Total Expenses</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatNaira(totalExpenses)}
            </span>
          </div>

          {/* Outstanding */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-foreground">Outstanding</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatNaira(totalOutstanding)}
            </span>
          </div>

          {/* Remaining Bread */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-foreground">Remaining Bread</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatNaira(remainingBreadTotal)}
            </span>
          </div>

          {/* Paid Outstanding */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-foreground">Paid Outstanding</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              -{formatNaira(totalPaidOutstanding)}
            </span>
          </div>

          {/* Subtotal */}
          <div className=" pb-3 border-b border-border bg-muted/50 px-3 py-2 rounded-lg">
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-semibold text-foreground">
                Subtotal
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatNaira(adjustedTotal)}
              </span>
            </div>
            {/* Revenue */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Total Production Value
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                -{formatNaira(total)}
              </span>
            </div>
          </div>

          {/* Final Balance */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg ${
              isBalanced
                ? "bg-blue-500/10 ring-1 ring-blue-500/20"
                : isShort
                  ? "bg-red-500/10 ring-1 ring-red-500/20"
                  : "bg-green-500/10 ring-1 ring-green-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className={`h-5 w-5 text-blue-400`} />
              ) : isShort ? (
                <TrendingDown className={`h-5 w-5 text-red-400`} />
              ) : (
                <TrendingUp className={`h-5 w-5 text-green-400`} />
              )}
              <span
                className={`text-base font-semibold ${
                  isBalanced
                    ? "text-blue-400"
                    : isShort
                      ? "text-red-400"
                      : "text-green-400"
                }`}
              >
                {isBalanced ? "Balanced" : isShort ? "Short" : "Excess"}
              </span>
            </div>
            <span
              className={`text-lg font-bold ${
                isBalanced
                  ? "text-blue-400"
                  : isShort
                    ? "text-red-400"
                    : "text-green-400"
              }`}
            >
              {isBalanced
                ? "₦0"
                : `${isShort ? "-" : "+"}₦${formatNumber(Math.abs(difference))}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
