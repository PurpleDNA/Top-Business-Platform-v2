"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { fetchFilteredSales, FilteredSale } from "@/app/services/sales";
import { fetchAllCustomers, Customer } from "@/app/services/customers";
import { fetchAllProductions, Production } from "@/app/services/productions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  ArrowLeft,
  Plus,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EditSaleModal } from "@/app/components/sales/EditSaleModal";
import { DeleteSaleDialog } from "@/app/components/sales/DeleteSaleDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getBadgeColorClasses } from "@/lib/utils";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatQuantity = (quantity: { [key: string]: number }) => {
  return Object.entries(quantity)
    .map(([color, qty]) => `${color[0].toUpperCase()}: ${qty}`)
    .join(" | ");
};

function AllSalesContent() {
  const [filters, setFilters] = useState<{
    customerId: string | null;
    productionId: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    customerId: null,
    productionId: null,
    startDate: null,
    endDate: null,
  });

  const [cache, setCache] = useState<
    Record<string, (FilteredSale | undefined)[]>
  >({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // We handle editing/deleting using the same modals.
  // We cast FilteredSale to SaleWithDetails where needed or adjust the type locally if structure matches enough.
  const [editingSale, setEditingSale] = useState<FilteredSale | null>(null);
  const [deletingSale, setDeletingSale] = useState<{
    id: string;
    customerName: string;
  } | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;

  // Map<filterKey, Set<batchNumber>>
  const fetchedBatches = useRef<Map<string, Set<number>>>(new Map());

  // Generate unique key for current filter state
  const filterKey = `${filters.customerId || "all"}-${
    filters.productionId || "all"
  }-${filters.startDate || "any"}-${filters.endDate || "any"}`;

  // Fetch customers and productions once
  useEffect(() => {
    const fetchData = async () => {
      const [customersData, productionsData] = await Promise.all([
        fetchAllCustomers(),
        fetchAllProductions(),
      ]);
      setCustomers(customersData as Customer[]);
      setProductions(productionsData as Production[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Fetch sales in batches
  useEffect(() => {
    const batchNumber = Math.floor((page - 1) / 5) + 1;

    // Get or create batch tracker for this filter (if not exist)
    if (!fetchedBatches.current.has(filterKey)) {
      fetchedBatches.current.set(filterKey, new Set());
    }
    const batchSet = fetchedBatches.current.get(filterKey)!;

    // Skip if already fetched
    if (batchSet.has(batchNumber)) return;

    const fetchBatch = async () => {
      setLoading(true);
      const salesData = await fetchFilteredSales(
        batchNumber,
        50,
        filters.customerId,
        filters.productionId,
        filters.startDate ? `${filters.startDate}T00:00:00` : null,
        filters.endDate ? `${filters.endDate}T23:59:59` : null
      );

      setCache((prev) => {
        const existingData = prev[filterKey] || [];
        const startIndex = (batchNumber - 1) * 50;
        const newData = [...existingData];
        // Ensure array is large enough before splicing
        while (newData.length < startIndex) {
          newData.push(undefined);
        }
        newData.splice(startIndex, salesData.length, ...salesData);

        // If we got fewer items than requested, we reached the end
        if (salesData.length < 50) {
          setTotalCounts((prev) => ({
            ...prev,
            [filterKey]: startIndex + salesData.length,
          }));
        }

        return { ...prev, [filterKey]: newData };
      });

      batchSet.add(batchNumber);
      setLoading(false);
    };

    fetchBatch();
  }, [
    page,
    filterKey,
    filters.customerId,
    filters.productionId,
    filters.startDate,
    filters.endDate,
  ]);

  const handleFilterChange = (
    type: "customer" | "production" | "startDate" | "endDate",
    value: string
  ) => {
    const fieldMap = {
      customer: "customerId",
      production: "productionId",
      startDate: "startDate",
      endDate: "endDate",
    } as const;
    const newFilters = {
      ...filters,
      [fieldMap[type]]: value === "all" || value === "" ? null : value,
    };
    setFilters(newFilters);
    router.push(`${pathname}?page=1`);
  };

  const handleClearDates = () => {
    setFilters((prev) => ({ ...prev, startDate: null, endDate: null }));
    router.push(`${pathname}?page=1`);
  };

  // Get data for current filter
  const currentFilterData = cache[filterKey] || [];

  // Important: currentFilterData might have holes if we fetched batch 2 but not batch 1.
  // We need to handle that gracefully or ensure we just render what we have.
  // However, the standard behavior is that the cache stores objects at their correct data-index.

  const startIndex = (page - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedSales = currentFilterData
    .slice(startIndex, endIndex)
    .filter((sale): sale is FilteredSale => !!sale);

  const isFirstPage = page === 1;
  const totalCount = totalCounts[filterKey];
  const isLastPage = totalCount !== undefined ? endIndex >= totalCount : false;

  // Calculate totals - ONLY for loaded data in this filter context
  // Note: Calculating "Total Sales Amount" for *all* data matching a filter would require
  // a separate aggregate query to the DB if we haven't loaded all batches.
  // For now, we sum what we have loaded.
  const totalSalesAmount = currentFilterData
    .filter(Boolean)
    .reduce((sum, sale) => sum + (sale?.amount || 0), 0);
  const totalOutstanding = currentFilterData
    .filter(Boolean)
    .reduce((sum, sale) => sum + (sale?.outstanding || 0), 0);

  if (loading && !cache[filterKey]) {
    // Show table skeleton when initial data for filter is loading
    // We let the header and filters render, but replace content with skeletons
  }

  return (
    <div className="min-h-full bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-lg lg:text-3xl font-bold tracking-tight">
                All Sales
              </h1>
            </div>
          </div>
          <Link href="/sale/new">
            <Button className="bg-primary hidden lg:flex">
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Sale
            </Button>
            <Button className="bg-primary lg:hidden">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">Customer</label>
            <SearchableSelect
              value={filters.customerId || "all"}
              onValueChange={(val) => handleFilterChange("customer", val)}
              placeholder="All Customers"
              options={[
                { value: "all", label: "All Customers" },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Production</label>
            <Select
              value={filters.productionId || "all"}
              onValueChange={(val) => handleFilterChange("production", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Productions" />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                <SelectItem value="all">All Productions</SelectItem>
                {productions.map((production) => (
                  <SelectItem key={production.id} value={production.id}>
                    {formatDate(production.created_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">From date</label>
            <input
              type="date"
              value={filters.startDate || ""}
              max={filters.endDate || undefined}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">To date</label>
              {(filters.startDate || filters.endDate) && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear dates
                </button>
              )}
            </div>
            <input
              type="date"
              value={filters.endDate || ""}
              min={filters.startDate || undefined}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Stats Cards - Visualization of currently loaded data */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loaded Sales Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !totalSalesAmount ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  ₦{totalSalesAmount.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loaded Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !totalOutstanding ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-destructive">
                  ₦{totalOutstanding.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Table View */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Sales History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !paginatedSales.length ? (
              <div className="space-y-4">
                {/* Skeleton Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : paginatedSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No sales found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your filters or create a new sale
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {sale.customer_name || "Unknown"}
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
                      <TableCell className="font-semibold">
                        ₦{sale.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {sale.remaining > 0 ? (
                          <span className="text-destructive font-medium">
                            ₦{sale.remaining.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">₦0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.paid ? "default" : "destructive"}>
                          {sale.paid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(sale.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-background"
                          >
                            <Link href={`/customers/page/${sale.customer_id}`}>
                              <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                View Customer
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              onClick={() => setEditingSale(sale)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Sale
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDeletingSale({
                                  id: sale.id,
                                  customerName: sale.customer_name || "Unknown",
                                })
                              }
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
            )}
          </CardContent>
        </Card>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {loading && !paginatedSales.length ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : paginatedSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No sales found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div>
              {paginatedSales.map((sale) => (
                <div
                  key={sale.id}
                  className="border-b border-muted py-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium">
                        {sale.customer_name || "Unknown"}
                      </h3>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-1">
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
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      Date: {formatDate(sale.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">
                        ₦{sale.amount.toLocaleString()}
                      </h3>
                      <span
                        className={`text-xs ${
                          sale.paid ? "text-green-500" : "text-destructive"
                        }`}
                      >
                        {sale.paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-background"
                      >
                        <Link href={`/customers/page/${sale.customer_id}`}>
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            View Customer
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => setEditingSale(sale)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            setDeletingSale({
                              id: sale.id,
                              customerName: sale.customer_name || "Unknown",
                            })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col items-center gap-2 pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isFirstPage}
              onClick={() =>
                router.push(`${pathname}?page=${Math.max(1, page - 1)}`)
              }
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={isLastPage}
              onClick={() => router.push(`${pathname}?page=${page + 1}`)}
            >
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingSale && (
        <EditSaleModal
          sale={{
            id: editingSale.id,
            amount: editingSale.amount,
            amount_paid: editingSale.amount_paid,
            outstanding: editingSale.outstanding,
            quantity_bought: editingSale.quantity_bought,
          }}
          open={!!editingSale}
          onOpenChange={(open) => !open && setEditingSale(null)}
        />
      )}

      {deletingSale && (
        <DeleteSaleDialog
          saleId={deletingSale.id}
          customerName={deletingSale.customerName}
          open={!!deletingSale}
          onOpenChange={(open) => !open && setDeletingSale(null)}
        />
      )}
    </div>
  );
}

export default function AllSalesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading sales...</p>
        </div>
      }
    >
      <AllSalesContent />
    </Suspense>
  );
}
