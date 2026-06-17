import { fetchAllCustomers, Customer } from "@/app/services/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import CustomerRow from "@/app/components/customer/CustomerRow";
import { formatNaira } from "@/app/services/utils";

const AllCustomersPage = async () => {
  const customers = (await fetchAllCustomers()) as Customer[];

  return (
    <div className="min-h-full bg-background p-6">
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
              <h1 className=" text:lg lg:text-3xl font-bold tracking-tight">
                All Customers
              </h1>
            </div>
            <p className="text-muted-foreground">
              Total: {customers.length} customers
            </p>
          </div>
          <Link href="/customers/new">
            <Button className="bg-primary hidden lg:block">Add Customer</Button>
            <Button className="bg-primary lg:hidden">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Customers Table */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Customer List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  No customers found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start by adding your first customer
                </p>
                <Link href="/customers/new">
                  <Button className="mt-4">Add Customer</Button>
                </Link>
              </div>
            ) : (
              <CustomerRow customers={customers} />
            )}
          </CardContent>
        </Card>
        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No customers found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start by adding your first customer
              </p>
              <Link href="/customers/new">
                <Button className="mt-4">Add Customer</Button>
              </Link>
            </div>
          ) : (
            <div>
              {customers.map((customer) => (
                <Link href={`/customers/page/${customer.id}`} key={customer.id}>
                  <div
                    key={customer.id}
                    className="border-b border-muted py-4 flex items-center justify-between focus:bg-accent/50 hover:bg-accent/50 cursor-pointer transition "
                  >
                    <div>
                      <h3 className="text-lg font-medium">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {customer.phone_number}
                      </p>
                    </div>
                    <h3
                      className={`${
                        customer.total_debt > 5000
                          ? "text-red-500"
                          : customer.total_debt > 0
                          ? "text-amber-500"
                          : "text-green-500"
                      } font-semibold`}
                    >
                      {formatNaira(customer.total_debt)}
                    </h3>
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

export default AllCustomersPage;
