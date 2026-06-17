"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
  fetchFilteredPayments,
  FilteredPayment,
} from "@/app/services/payments";
import { fetchAllCustomers, Customer } from "@/app/services/customers";
import { fetchAllProductions, Production } from "@/app/services/productions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowLeft,
  Plus,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EditPaymentModal } from "@/app/components/payments/EditPaymentModal";
import { DeletePaymentDialog } from "@/app/components/payments/DeletePaymentDialog";
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AllPaymentsContent() {
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
    Record<string, (FilteredPayment | undefined)[]>
  >({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [editingPayment, setEditingPayment] = useState<FilteredPayment | null>(
    null
  );
  const [deletingPayment, setDeletingPayment] = useState<{
    id: number;
    customerName: string;
    amount: number;
  } | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;

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

  // Fetch payments in batches
  useEffect(() => {
    const batchNumber = Math.floor((page - 1) / 5) + 1;

    // Get or create batch tracker for this filter
    if (!fetchedBatches.current.has(filterKey)) {
      fetchedBatches.current.set(filterKey, new Set());
    }
    const batchSet = fetchedBatches.current.get(filterKey)!;

    // Skip if already fetched
    if (batchSet.has(batchNumber)) return;

    const fetchBatch = async () => {
      setLoading(true);
      const paymentsData = await fetchFilteredPayments(
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
        newData.splice(startIndex, paymentsData.length, ...paymentsData);

        // If we got fewer items than requested, we reached the end
        if (paymentsData.length < 50) {
          setTotalCounts((prev) => ({
            ...prev,
            [filterKey]: startIndex + paymentsData.length,
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

  const startIndex = (page - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedPayments = currentFilterData
    .slice(startIndex, endIndex)
    .filter(Boolean) as FilteredPayment[];

  const isFirstPage = page === 1;
  const totalCount = totalCounts[filterKey];
  const isLastPage = totalCount !== undefined ? endIndex >= totalCount : false;

  // Calculate totals from LOADED filtered payments
  const totalPaymentsAmount = currentFilterData
    .filter(Boolean)
    .reduce((sum, payment) => sum + (payment?.amount_paid || 0), 0);
  // Note: distributed/on-demand counts are only for loaded data
  const distributedPaymentsCount = currentFilterData
    .filter(Boolean)
    .filter((payment) => !payment?.sale_id).length;
  const onDemandPaymentsCount = currentFilterData
    .filter(Boolean)
    .filter((payment) => payment?.sale_id).length;

  // We only block full page render if we have no loaded data for this filter AND we are loading it for the first time
  // Wait, actually with the skeleton approach we never want to block the full page after the initial static data (customers/productions) is loaded.
  // The skeleton logic handles the data loading visualization.

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
                All Payments
              </h1>
            </div>
          </div>
          <Link href="/payment/new">
            <Button className="bg-primary hidden lg:flex">
              <Wallet className="h-4 w-4 mr-2" />
              New Payment
            </Button>
            <Button className="bg-primary lg:hidden">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
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

        {/* Stats Cards - Hidden on Mobile */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loaded Payments Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !totalPaymentsAmount ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  ₦{totalPaymentsAmount.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Distributed Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !distributedPaymentsCount && !totalPaymentsAmount ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-500">
                  {distributedPaymentsCount}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                On-Demand Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !onDemandPaymentsCount && !totalPaymentsAmount ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-500">
                  {onDemandPaymentsCount}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Table View */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !paginatedPayments.length ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : paginatedPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No payments found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your filters or create a new payment
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Production</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {payment.customer_name || "Unknown"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₦{payment.amount_paid.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.type == "on_demand"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {payment.type == "on_demand"
                            ? "On-Demand"
                            : "Paid-Out"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.production_date
                          ? formatDate(payment.production_date)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.paid_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatTime(payment.paid_at)}
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
                            <Link
                              href={`/customers/page/${payment.customer_id}`}
                            >
                              <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                View Customer
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              onClick={() => setEditingPayment(payment)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDeletingPayment({
                                  id: payment.id,
                                  customerName:
                                    payment.customer_name || "Unknown",
                                  amount: payment.amount_paid,
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
          {loading && !paginatedPayments.length ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : paginatedPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No payments found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div>
              {paginatedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="border-b border-muted py-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium">
                        {payment.customer_name || "Unknown"}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.paid_at)} •{" "}
                      {formatTime(payment.paid_at)}
                    </p>
                    <Badge
                      className="mt-1"
                      variant={payment.sale_id ? "default" : "secondary"}
                    >
                      {payment.sale_id ? "On-Demand" : "Distributed"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">
                        ₦{payment.amount_paid.toLocaleString()}
                      </h3>
                      <span className="text-xs text-muted-foreground capitalize">
                        {payment.type}
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
                        <Link href={`/customers/page/${payment.customer_id}`}>
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            View Customer
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          onClick={() => setEditingPayment(payment)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            setDeletingPayment({
                              id: payment.id,
                              customerName: payment.customer_name || "Unknown",
                              amount: payment.amount_paid,
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
      {editingPayment && (
        <EditPaymentModal
          payment={{
            id: editingPayment.id,
            amount: editingPayment.amount_paid,
            type: editingPayment.type,
            sale_id: editingPayment.sale_id,
          }}
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
        />
      )}

      {deletingPayment && (
        <DeletePaymentDialog
          paymentId={deletingPayment.id}
          customerName={deletingPayment.customerName}
          amount={deletingPayment.amount}
          open={!!deletingPayment}
          onOpenChange={(open) => !open && setDeletingPayment(null)}
        />
      )}
    </div>
  );
}

export default function AllPaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      }
    >
      <AllPaymentsContent />
    </Suspense>
  );
}
