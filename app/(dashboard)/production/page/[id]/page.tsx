/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  getProductionById,
  getProductionOutstanding,
  getProductionPaidOutstanding,
  calculateBreadTotal,
} from "@/app/services/productions";
import { OutstandingSection } from "@/app/components/productions/OutstandingSection";
import { ExpenseDropdown } from "@/app/components/productions/ExpenseDropdown";
import { RemainingBreadDropdown } from "@/app/components/productions/RemainingBreadDropdown";
import { CashInput } from "@/app/components/productions/CashInput";
import { ProductionActions } from "@/app/components/productions/ProductionActions";
import { getExpensesByProdId } from "@/app/services/expenses";
import { fetchSalesByProductionId } from "@/app/services/sales";
import RecentSalesTable from "@/app/components/productions/RecentSalesTable";
import { FinancialSummary } from "@/app/components/productions/FinancialSummary";
import { formatDate, formatDateTime } from "@/app/services/utils";
import {
  Factory,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Package,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { isSuperAdmin } from "@/app/services/roles";
import { getSortedBreadItems } from "@/lib/utils";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const production = await getProductionById(id);
  const outstandingList = (await getProductionOutstanding(id)) || [];
  const paidOutstandingList = (await getProductionPaidOutstanding(id)) || [];
  const expenses = await getExpensesByProdId(id);
  const sales = await fetchSalesByProductionId(id);
  const isSuper = await isSuperAdmin();

  if (!production) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Production Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The production record you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/productions/all"
            className="text-primary hover:text-primary/80"
          >
            Back to Productions
          </Link>
        </div>
      </div>
    );
  }

  const { total, quantity, cash, created_at, old_bread, sold_bread } =
    production;

  // Use remaining_bread from database
  const remaining_bread = production.remaining_bread || {};

  // Calculate old_bread & remaining_bread monetary value
  const oldBreadTotal = await calculateBreadTotal(old_bread);
  const remainingBreadTotal = await calculateBreadTotal(remaining_bread);

  const isOldBread = Object.values(old_bread).some((color) => {
    return color != 0;
  });

  // Calculate total expenses from expenses table
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate outstanding amounts
  const totalOutstanding = outstandingList.reduce(
    (sum, item) => sum + (item.outstanding || 0),
    0,
  );

  // Calculate paid outstanding total from the paidOutstandingList
  const totalPaidOutstanding = paidOutstandingList.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

  // Financial calculations
  // Money we have: cash + expenses + outstanding + remaining bread value
  const totalMoneyIn =
    cash + totalExpenses + totalOutstanding + remainingBreadTotal;

  // Subtract paid outstanding (money that was paid back)
  const adjustedTotal = totalMoneyIn - totalPaidOutstanding;

  // Compare with revenue to see if we're short, excess, or balanced
  const difference = adjustedTotal - total;

  const isShort = difference < 0;
  const isExcess = difference > 0;
  const isBalanced = difference === 0;

  // Determine status badge configuration
  const getStatusConfig = () => {
    if (isBalanced) {
      return {
        label: "Balanced",
        icon: CheckCircle2,
        className: "bg-blue-500/10 text-blue-500 ring-1 ring-blue-300/20",
      };
    } else if (isShort) {
      return {
        label: "Short",
        icon: TrendingDown,
        className: "bg-red-500/10 text-red-500 ring-1 ring-red-300/20",
      };
    } else {
      return {
        label: "Excess",
        icon: TrendingUp,
        className: "bg-green-500/10 text-green-500 ring-1 ring-green-300/20",
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Calculate total quantity dynamically from all bread types
  const totalQuantity = Object.keys(quantity).reduce((sum, type) => {
    return sum + (quantity[type] || 0) + (old_bread[type] || 0);
  }, 0);

  // Format production ID (show first 8 chars)
  const shortId = id.substring(0, 8).toUpperCase();

  const sortedQuantity = getSortedBreadItems(quantity, production.bread_price);
  const sortedOldBread = getSortedBreadItems(old_bread, production.bread_price);

  return (
    <div className="bg-background text-foreground antialiased selection:bg-primary/20 scrollbar-hide">
      <div className="min-h-full">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/productions/all"
                  className="h-8 w-8 rounded-md bg-muted border border-border flex items-center justify-center hover:bg-accent transition"
                >
                  <ArrowLeft className="h-4 w-4 text-foreground" />
                </Link>
                <div className="h-8 w-8 rounded-md bg-muted border border-border items-center justify-center hidden lg:flex">
                  <Factory className="h-4 w-4 text-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Production Dashboard
                </div>
              </div>
              <ProductionActions
                productionId={id}
                initialOpenStatus={production.open}
                production={production}
                isSuper={isSuper}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 gap-6">
            {/* Production Overview */}
            <section className="xl:col-span-1 rounded-xl border border-border bg-card">
              <div className="p-5 border-b border-border">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-lg ring-1 ring-border bg-gradient-to-br from-blue-500 via-green-500 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
                    <Factory className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl tracking-tight font-semibold text-foreground">
                        Production #{shortId}
                      </h1>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md ${statusConfig.className}`}
                      >
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>
                    <h2>{formatDateTime(created_at)}</h2>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {/* Product Quantities Breakdown */}
                <div
                  className={`grid grid-cols-1 ${
                    isOldBread && "md:grid-cols-2"
                  } gap-4`}
                >
                  <div className="mb-4 rounded-lg bg-muted/50 ring-1 ring-border p-4">
                    <dt className="text-xs text-muted-foreground mb-3">
                      Production
                    </dt>
                    <div className="space-y-3">
                      {sortedQuantity.map(
                        (breadType) =>
                          breadType.quantity > 0 && (
                            <div
                              key={breadType.color}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-3 w-3 rounded-full bg-${breadType.color}-500`}
                                ></div>
                                <span className="text-sm text-foreground capitalize">
                                  {breadType.color}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-foreground">
                                {breadType.quantity.toLocaleString()}
                              </span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                  {isOldBread && (
                    <div className="mb-4 rounded-lg bg-muted/50 ring-1 ring-border p-4">
                      <dt className="text-xs text-muted-foreground mb-3">
                        Old Bread
                      </dt>
                      <div className="space-y-3">
                        {sortedOldBread.map(
                          (breadType) =>
                            breadType.quantity > 0 && (
                              <div
                                key={breadType.color}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3 w-3 rounded-full bg-${breadType.color}-500`}
                                  ></div>
                                  <span className="text-sm text-foreground capitalize">
                                    {breadType.color}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {breadType.quantity.toLocaleString()}
                                </span>
                              </div>
                            ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 ring-1 ring-border p-4">
                    <dt className="text-xs text-muted-foreground flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      Total Bread
                    </dt>
                    <dd className="mt-1 text-sm text-foreground font-semibold">
                      {totalQuantity.toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/50 ring-1 ring-border p-4">
                    <dt className="text-xs text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      Total Value
                    </dt>
                    <dd className="mt-1 text-sm text-foreground font-semibold">
                      ₦{total.toLocaleString()}
                    </dd>
                  </div>
                  {/* Cash Collected */}
                  <div className="mt-6">
                    <CashInput productionId={id} initialCash={cash} />
                  </div>
                </dl>
              </div>
            </section>

            {/* Metrics Section */}
            <section className="xl:col-span-2 space-y-6">
              {/* Outstanding Section */}
              <div className="mt-6">
                <OutstandingSection
                  outstanding={outstandingList}
                  paidOutstanding={paidOutstandingList}
                />
              </div>

              {/* Expenses Section */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <ExpenseDropdown data={expenses} />
                <RemainingBreadDropdown
                  remainingBreadTotal={remainingBreadTotal}
                  remainingBread={remaining_bread}
                  multipliers={production.bread_price}
                />
              </div>

              {/* Financial Summary */}
              <FinancialSummary
                cash={cash}
                totalExpenses={totalExpenses}
                totalOutstanding={totalOutstanding}
                remainingBreadTotal={remainingBreadTotal}
                totalPaidOutstanding={totalPaidOutstanding}
                adjustedTotal={adjustedTotal}
                total={total}
                difference={difference}
                isBalanced={isBalanced}
                isShort={isShort}
              />
              {/* Recent Sales Section */}
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Recent Sales
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Latest sales for this production
                    </p>
                  </div>
                  <Link
                    href={`/sales/production/${id}`}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <RecentSalesTable sales={sales} />
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="max-w-7xl mx-auto px-6 py-8 text-xs text-muted-foreground">
          © 2025 Top Business Platform — Production Management
        </footer>
      </div>
    </div>
  );
};

export default page;
