import { fetchSalesByProductionId } from "@/app/services/sales";
import { getProductionById } from "@/app/services/productions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Plus, User } from "lucide-react";
import Link from "next/link";
import SalesTable from "@/app/components/productions/SalesTable";
import { formatNaira } from "@/app/services/utils";

const AllSalesPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const sales = await fetchSalesByProductionId(id);
  const production = await getProductionById(id);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatQuantity = (quantity?: { [key: string]: number } | null) => {
    return Object.entries(quantity || {})
      .map(([color, qty]) => `${color[0].toUpperCase()}: ${qty}`)
      .join("| ");
  };
  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalOutstanding = sales.reduce(
    (sum, sale) => sum + sale.outstanding,
    0
  );
  const paidSalesCount = sales.filter((sale) => sale.paid).length;

  return (
    <div className="min-h-full bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href={`/production/page/${id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg lg:text-3xl font-bold tracking-tight">
                  Sales for Production
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formatDate(production.created_at)}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground lg:hidden">
              Total: {sales.length} sales
            </p>
          </div>
          <Link href={`/sale/new?production_id=${id}`}>
            <Button className="bg-primary hidden lg:flex">
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Sale
            </Button>
            <Button className="bg-primary lg:hidden">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Stats Cards - Hidden on Mobile */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sales Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNaira(totalSalesAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatNaira(totalOutstanding)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid / Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paidSalesCount} / {sales.length}
              </div>
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
            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No sales found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start by recording your first sale for this production
                </p>
                <Link href={`/sale/new?production_id=${id}`}>
                  <Button className="mt-4">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    New Sale
                  </Button>
                </Link>
              </div>
            ) : (
              <SalesTable sales={sales} />
            )}
          </CardContent>
        </Card>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No sales found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start by recording your first sale for this production
              </p>
              <Link href={`/sale/new?production_id=${id}`}>
                <Button className="mt-4">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Sale
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              {sales.map((sale) => (
                <Link
                  href={`/customers/page/${sale.customer_id}`}
                  key={sale.id}
                >
                  <div className="border-b border-muted py-4 flex items-center justify-between focus:bg-accent/50 hover:bg-accent/50 cursor-pointer transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium">
                          {sale.customers?.name || "Unknown"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">
                          {formatQuantity(sale.quantity_bought)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">
                        {formatNaira(sale.amount)}
                      </h3>
                      <span
                        className={`text-xs ${
                          sale.paid ? "text-green-500" : "text-destructive"
                        }`}
                      >
                        {sale.paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllSalesPage;
