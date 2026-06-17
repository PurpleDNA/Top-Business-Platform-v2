import React from "react";
import {
  fetchCustomerById,
  fetchCustomerTotalSpent,
  fetchCustomerMonthlyPurchases,
} from "@/app/services/customers";
import { fetchSalesByCustomerId } from "@/app/services/sales";
import { formatDate } from "@/app/services/utils";
import PaymentHistory from "@/app/components/customer/PaymentHistory";
import { AlertTriangle } from "lucide-react";
import PurchaseHistory from "@/app/components/customer/PurchaseHistory";
import { getPaymentsByCustomerID } from "@/app/services/payments";
import { CustomerActions } from "@/app/components/customer/CustomerActions";
import MonthlyPurchasesChart from "@/app/components/customer/MonthlyPurchasesChart";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const customer = await fetchCustomerById(id);
  const { name, email, phone_number, created_at, has_debt, total_debt } =
    customer;
  const sales = await fetchSalesByCustomerId(id);
  const total_spent = await fetchCustomerTotalSpent(id);
  // Fetch all payment history (using a high limit to get all records)
  const payment_history = await getPaymentsByCustomerID(id, 1000);
  const monthlyPurchases = await fetchCustomerMonthlyPurchases(id);

  // Helper function to get initials from full name
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(" ");
    if (names.length === 1) {
      return names[0]?.charAt(0).toUpperCase() || "?";
    }
    return (
      (names[0]?.charAt(0) || "") + (names[names.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className="bg-background text-foreground antialiased selection:bg-primary/20 scrollbar-hide">
      <div className="min-h-full">
        {/* <!-- Topbar --> */}
        <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-muted border border-border flex items-center justify-center text-xs font-semibold tracking-tight text-foreground">
                  CX
                </div>
                <div className="text-sm text-muted-foreground">
                  Customer Dashboard
                </div>
              </div>
              <CustomerActions customerId={id} customer={customer} />
            </div>
          </div>
        </header>

        {/* <!-- Main --> */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row  gap-6">
            {/* <!-- Customer Overview --> */}
            <section className="xl:col-span-1 rounded-xl border border-border bg-card">
              <div className="p-5 border-b border-border">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-lg ring-1 ring-border bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl tracking-tight font-semibold text-foreground">
                        {name}
                      </h1>
                      <span
                        id="debtStatusBadge"
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 whitespace-nowrap ${
                          has_debt ? `text-amber-500` : `text-green-500`
                        } ring-1 ring-amber-300/20`}
                      >
                        {has_debt && <AlertTriangle size={12} />}
                        {has_debt ? "Has Debt" : "Debt Free"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 ring-1 ring-border p-4">
                    <dt className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* user2 icon */}
                      Username
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{name}</dd>
                  </div>
                  <div className="rounded-lg bg-muted/50 ring-1 ring-border p-4">
                    <dt className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* phone icon */}
                      Phone
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {phone_number}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/50 ring-1 ring-border p-4">
                    <dt className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* mail icon */}
                      Email
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {email || "customer@email.com"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/50 ring-1 ring-border p-4">
                    <dt className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* calendar icon */}
                      Member Since
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatDate(created_at)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* <!-- Metrics + Chart --> */}
            <section className="xl:col-span-2 space-y-6">
              {/* <!-- KPI Cards --> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* wallet icon */}
                      Outstanding Debt
                    </p>
                    {/* <span className="text-[10px] text-muted-foreground">Due</span> */}
                  </div>
                  <div
                    id="outstandingAmount"
                    data-amount="243.50"
                    className="mt-2 text-2xl tracking-tight font-semibold text-foreground"
                  >
                    ₦{total_debt}
                  </div>
                </div>

                <div className="rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* clock icon */}
                      Last Purchase
                    </p>
                    {sales.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(sales[0].created_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl tracking-tight font-semibold text-foreground">
                    {sales.length > 0 ? `₦${sales[0].amount}` : "N/A"}
                  </div>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* shopping bag icon */}
                      Total Orders
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      All time
                    </span>
                  </div>
                  <div className="mt-2 text-2xl tracking-tight font-semibold text-foreground">
                    {sales.length}
                  </div>
                  {/* <div className="mt-1 text-xs text-emerald-400 inline-flex items-center gap-1">

                    +6 this quarter
                  </div> */}
                </div>

                <div className="rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      {/* circle-dollar-sign icon */}
                      Total Spent
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      All time
                    </span>
                  </div>
                  <div className="mt-2 text-2xl tracking-tight font-semibold text-foreground">
                    ₦{total_spent}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Avg. ₦{total_spent / sales.length} / order
                  </div>
                </div>
              </div>

              {/* <!-- Chart + Debt Status --> */}
              <div className="grid grid-cols-1  gap-4">
                <div className="lg:col-span-2 rounded-xl bg-card border border-border p-1">
                  <div className="flex items-center justify-between px-3">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-foreground">
                        Monthly Purchases
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Last 6 months
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs bg-muted border border-border px-2.5 py-1 rounded-md">
                      {/* line chart icon */}
                      Updated now
                    </div>
                  </div>
                  {/* <!-- Wrapper to avoid canvas growth bug --> */}
                  <div className="mt-3">
                    <div className="h-56">
                      {/* <canvas
                        id="purchasesChart"
                        className="w-full h-full"
                      ></canvas> */}
                      <MonthlyPurchasesChart data={monthlyPurchases} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* <!-- Payment and Purchase History Table --> */}
          <PaymentHistory payment_history={payment_history} />
          <PurchaseHistory sales={sales} />
        </main>

        <footer className="max-w-7xl mx-auto px-6 py-8 text-xs text-muted-foreground">
          © 2025 CX — Top Special
        </footer>
      </div>
    </div>
  );
};

export default page;
