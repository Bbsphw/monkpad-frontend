// src/app/(protected)/dashboard/page.tsx
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentTransactionsTable } from "@/components/dashboard/recent-transactions-table";
import { TrafficAreaChart } from "@/components/dashboard/traffic-area-chart";
import { trafficData, categoryData, transactionRows } from "./_data/mock";

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      {/* KPI Cards */}
      <OverviewCards />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficAreaChart data={trafficData} />
        </div>
        <CategoryDonutChart data={categoryData} />
      </div>

      {/* Transactions */}
      <RecentTransactionsTable rows={transactionRows} />
    </div>
  );
}
