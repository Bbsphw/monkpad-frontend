// // src/app/(protected)/dashboard/_hooks/use-dashboard.ts

// "use client";

// import * as React from "react";
// import {
//   getDashboardSummary,
//   getDashboardCategories,
//   getDashboardTraffic,
//   getDashboardRecent,
// } from "../_services/dashboard-service";
// import type {
//   SummaryPayload,
//   CategoryRow,
//   TrafficPoint,
//   RecentRow,
// } from "../_types/dashboard";

// export function useDashboard() {
//   const today = new Date();
//   const [year, setYear] = React.useState<number>(today.getFullYear());
//   const [month, setMonth] = React.useState<number>(today.getMonth() + 1);
//   const [type, setType] = React.useState<"income" | "expense" | "all">("all");

//   const [summary, setSummary] = React.useState<SummaryPayload | null>(null);
//   const [categories, setCategories] = React.useState<CategoryRow[] | null>(
//     null
//   );
//   const [traffic, setTraffic] = React.useState<TrafficPoint[] | null>(null);
//   const [recent, setRecent] = React.useState<RecentRow[] | null>(null);

//   const [loading, setLoading] = React.useState<boolean>(true);
//   const [error, setError] = React.useState<string | null>(null);

//   const reload = React.useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [sum, cat, trf, rec] = await Promise.all([
//         getDashboardSummary({ year, month }),
//         getDashboardCategories({ year, month, type: "expense" }), // default แสดงสัดส่วนรายจ่าย
//         getDashboardTraffic({ year }),
//         getDashboardRecent(10),
//       ]);

//       setSummary(sum);
//       setCategories(cat);
//       setTraffic(trf);
//       setRecent(rec);
//     } catch (e: any) {
//       setError(e?.message || "Load dashboard failed");
//     } finally {
//       setLoading(false);
//     }
//   }, [year, month]);

//   React.useEffect(() => {
//     void reload();
//   }, [reload]);

//   return {
//     // state
//     year,
//     month,
//     type,
//     setYear,
//     setMonth,
//     setType,
//     // data
//     summary,
//     categories,
//     traffic,
//     recent,
//     // flags
//     loading,
//     error,
//     // actions
//     reload,
//   };
// }

// src/app/(protected)/dashboard/_hooks/use-dashboard.ts

"use client";

import useSWR from "swr";
import * as React from "react";
import { fetchJSONClient } from "@/lib/http-client";
import type {
  SummaryPayload,
  CategoryRow,
  TrafficPoint,
  TrafficAreaPoint,
  RecentRow,
} from "../_types/dashboard";
import {
  buildSummary,
  buildMonthlyTraffic,
  toAreaSeries,
  buildRecent,
  buildCategorySeries,
  countMonthlyTx,
  type TxDTO,
} from "../_services/dashboard-service";

/** fetcher: ดึง route เดียว แล้ว derive ทุกอย่างในครั้งเดียว */
async function fetchDashboardBundle([key, year, month, type]: [
  string,
  number,
  number,
  "income" | "expense"
]) {
  const res = await fetchJSONClient<any>(
    `/api/dashboard/categories?` +
      new URLSearchParams({
        year: String(year),
        month: String(month),
        type,
      }).toString()
  );

  const payload = (res as any)?.data ?? res;
  const txs: TxDTO[] = Array.isArray(payload?.transactions)
    ? payload.transactions
    : [];

  if (txs.length) {
    const summary: SummaryPayload = buildSummary(txs, year, month);
    const trafficMonthly: TrafficPoint[] = buildMonthlyTraffic(txs, year);
    const trafficArea: TrafficAreaPoint[] = toAreaSeries(trafficMonthly, year);
    const recent: RecentRow[] = buildRecent(txs);
    const categories: CategoryRow[] = buildCategorySeries(
      txs,
      year,
      month,
      type
    );
    const txCount = countMonthlyTx(txs, year, month);
    return {
      summary,
      categories,
      trafficMonthly,
      trafficArea,
      recent,
      txCount,
    };
  }

  // fallback (กรณี backend ยังไม่ส่ง transactions กลับมา)
  const categories: CategoryRow[] = Array.isArray(payload?.categories)
    ? payload.categories
    : Array.isArray(payload?.legacy)
    ? payload.legacy
    : Array.isArray(payload)
    ? payload
    : [];

  const totalExpense = categories.reduce((s, c) => s + (c.expense || 0), 0);
  const summary: SummaryPayload = {
    year,
    month,
    income: 0,
    expense: totalExpense,
    balance: -totalExpense,
    txCount: 0,
  } as any;

  return {
    summary,
    categories,
    trafficMonthly: [] as TrafficPoint[],
    trafficArea: [] as TrafficAreaPoint[],
    recent: [] as RecentRow[],
    txCount: 0,
  };
}

export function useDashboard() {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  const [type, setType] = React.useState<"income" | "expense" | "all">("all");

  // เราอยากดูสัดส่วน "รายจ่าย" ในโดนัทเหมือนเดิม → ให้ type/query เป็น "expense"
  const queryType: "income" | "expense" = "expense";

  const swrKey: [string, number, number, "income" | "expense"] = [
    "dashboard-bundle",
    year,
    month,
    queryType,
  ];

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetchDashboardBundle,
    {
      // ⚡️ ป้องกันการยิงซ้ำใน StrictMode Dev + ทำ UX ลื่น
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    }
  );

  return {
    year,
    month,
    type,
    setYear,
    setMonth,
    setType,
    summary: data?.summary ?? null,
    categories: data?.categories ?? null,
    traffic: data?.trafficMonthly ?? null,
    trafficArea: data?.trafficArea ?? null,
    recent: data?.recent ?? null,
    txCount: data?.txCount ?? 0,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    reload: () => mutate(), // ให้ DashboardClient เรียก refresh ได้
  };
}
