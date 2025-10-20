// // src/app/(protected)/dashboard/_components/dashboard-client.tsx

// "use client";

// import { useDashboard } from "../_hooks/use-dashboard";
// import { CategoryDonutChart } from "./category-donut-chart";
// import { OverviewCards } from "./overview-cards";
// import { RecentTransactionsTable } from "./recent-transactions-table";
// import { TrafficAreaChart } from "./traffic-area-chart";

// export default function DashboardClient() {
//   const { loading, error, summary, categories, recent, traffic, year, month } =
//     useDashboard();

//   const overviewItems = summary && [
//     {
//       id: "income",
//       title: "รายรับเดือนนี้",
//       value: summary.income,
//       valueType: "currency" as const,
//       accent: "success" as const,
//     },
//     {
//       id: "expense",
//       title: "รายจ่ายเดือนนี้",
//       value: summary.expense,
//       valueType: "currency" as const,
//       accent: "danger" as const,
//     },
//     {
//       id: "balance",
//       title: "ยอดคงเหลือ",
//       value: summary.balance,
//       valueType: "currency" as const,
//       accent: "primary" as const,
//     },
//     {
//       id: "txCount",
//       title: "จำนวนธุรกรรม",
//       value: 0,
//       valueType: "number" as const,
//       accent: "info" as const,
//     },
//   ];

//   // reports/monthly → TrafficAreaPoint[]
//   const trafficAsArea = (traffic ?? []).map((p) => {
//     const [mm, yy] = p.month.split("/");
//     const fullYear = Number(yy.length === 2 ? `20${yy}` : yy);
//     const iso = `${fullYear}-${String(mm).padStart(2, "0")}-01`;
//     return { date: iso, income: p.income, expense: p.expense };
//   });

//   // recent → RecentTransactionsTable rows
//   const recentRows = (recent ?? []).map((r) => ({
//     id: String(r.id),
//     date: r.date,
//     type: r.type,
//     category: r.tag ?? r.category ?? "-",
//     amount: Number(r.value ?? r.amount ?? 0) || 0,
//     note: r.note ?? "",
//   }));

//   return (
//     <div className="grid gap-6">
//       <OverviewCards items={overviewItems ?? undefined} isLoading={loading} />

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2">
//           <TrafficAreaChart
//             data={trafficAsArea}
//             isLoading={loading}
//             title="แนวโน้มรายรับ–รายจ่าย"
//             description={`ย้อนหลังในปี ${year}`}
//           />
//         </div>

//         <CategoryDonutChart
//           data={categories ?? []}
//           isLoading={loading}
//           title={`สัดส่วนรายจ่าย (${year}-${String(month).padStart(2, "0")})`}
//         />
//       </div>

//       <RecentTransactionsTable rows={recentRows} isLoading={loading} />

//       {error && (
//         <div className="text-sm text-destructive">
//           ไม่สามารถโหลดข้อมูลแดชบอร์ด: {error}
//         </div>
//       )}
//     </div>
//   );
// }

// src/app/(protected)/dashboard/_components/dashboard-client.tsx
"use client";

import { useDashboard } from "../_hooks/use-dashboard";
import { CategoryDonutChart } from "./category-donut-chart";
import { OverviewCards } from "./overview-cards";
import { RecentTransactionsTable } from "./recent-transactions-table";
import { TrafficAreaChart } from "./traffic-area-chart";

export default function DashboardClient() {
  const {
    loading,
    error,
    summary,
    categories,
    recent,
    trafficArea,
    txCount,
    year,
    month,
  } = useDashboard();

  const overviewItems = summary && [
    {
      id: "income",
      title: "รายรับเดือนนี้",
      value: summary.income,
      valueType: "currency" as const,
      accent: "success" as const,
    },
    {
      id: "expense",
      title: "รายจ่ายเดือนนี้",
      value: summary.expense,
      valueType: "currency" as const,
      accent: "danger" as const,
    },
    {
      id: "balance",
      title: "ยอดคงเหลือ",
      value: summary.balance,
      valueType: "currency" as const,
      accent: "primary" as const,
    },
    {
      id: "txCount",
      title: "จำนวนธุรกรรม",
      value: txCount,
      valueType: "number" as const,
      accent: "info" as const,
    },
  ];

  // recent → table rows (normalize เผื่อ amount/value/tag)
  const recentRows = (recent ?? []).map((r) => ({
    id: String(r.id),
    date: r.date,
    type: r.type,
    category: r.category ?? r.tag ?? "-",
    amount: Number(r.amount ?? 0) || 0,
    note: r.note ?? "",
  }));

  return (
    <div className="grid gap-6">
      <OverviewCards items={overviewItems ?? undefined} isLoading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficAreaChart
            data={trafficArea ?? []}
            isLoading={loading}
            title="แนวโน้มรายรับ–รายจ่าย"
            description={`ย้อนหลังในปี ${year}`}
          />
        </div>

        <CategoryDonutChart
          data={categories ?? []}
          isLoading={loading}
          title={`สัดส่วนรายจ่าย (${year}-${String(month).padStart(2, "0")})`}
        />
      </div>

      <RecentTransactionsTable rows={recentRows} isLoading={loading} />

      {error && (
        <div className="text-sm text-destructive">
          ไม่สามารถโหลดข้อมูลแดชบอร์ด: {error}
        </div>
      )}
    </div>
  );
}
