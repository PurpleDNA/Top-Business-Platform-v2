// import { SalesChart } from "@/app/components/dashboard/SalesChart";
import { MetricsCard } from "@/app/components/dashboard/MetricsCard";
import { CustomersTable } from "@/app/components/dashboard/CustomersTable";
import { ProductionsTable } from "@/app/components/dashboard/ProductionsTable";
import { SalesTable } from "@/app/components/dashboard/SalesTable";
import { DollarSign, Factory } from "lucide-react";
import { getTotalBusinessOutstanding } from "@/app/services/outstanding";
import Hero from "@/app/components/dashboard/Hero";
import { getLatestProduction } from "@/app/services/productions";
import { ProductionCard } from "@/app/components/dashboard/ProductionCard";
import { Production } from "@/app/services/productions";
import { formatDate } from "@/app/services/utils";
import { getUser } from "@/app/services/roles";

const Index = async () => {
  const profile = await getUser();
  const totalOutstanding = await getTotalBusinessOutstanding();
  const latestProduction = (await getLatestProduction()) as Production | null;

  // Defensive handling for missing production data
  const breadTypes = latestProduction?.bread_price
    ? Object.keys(latestProduction.bread_price)
    : [];

  // Dynamically build value object from bread types (quantity + old_bread)
  const productionValue = breadTypes.reduce((acc, breadType) => {
    const quantity = latestProduction?.quantity?.[breadType] || 0;
    const oldBread = latestProduction?.old_bread?.[breadType] || 0;
    acc[breadType] = String(quantity + oldBread);
    return acc;
  }, {} as Record<string, string>);

  const date =
    (latestProduction?.created_at &&
      formatDate(latestProduction?.created_at)) ||
    "No data";

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto p-6 space-y-6">
        {/* Hero Section */}
        <Hero profile={profile} />
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricsCard
            title="Total Customer Debt"
            value={`₦${totalOutstanding}`}
            change="+12% from last week"
            changeType="negative"
            icon={DollarSign}
            description="Outstanding customer payments"
          />

          <ProductionCard
            title={`Latest Production - ${date}`}
            value={productionValue}
            multipliers={latestProduction?.bread_price || {}}
            total={`₦${latestProduction?.total || 0}`}
            icon={Factory}
            description="Manufacturing output"
          />
        </div>

        {/* Charts and Tables Section */}
        <div className="lg:col-span-3 space-y-6 lg:px-6">
          <SalesTable />
          <ProductionsTable />
          <CustomersTable />
        </div>
      </main>
    </div>
  );
};

export default Index;
