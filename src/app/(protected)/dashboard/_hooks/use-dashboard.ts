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
// src/app/(protected)/dashboard/_hooks/use-dashboard.ts
"use client";

import * as React from "react";
import { getDashboardAll } from "../_services/dashboard-service";
import type {
  SummaryPayload,
  CategoryRow,
  TrafficPoint,
  TrafficAreaPoint,
  RecentRow,
} from "../_types/dashboard";

export function useDashboard() {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  const [type, setType] = React.useState<"income" | "expense" | "all">("all");

  const [summary, setSummary] = React.useState<SummaryPayload | null>(null);
  const [categories, setCategories] = React.useState<CategoryRow[] | null>(
    null
  );
  const [traffic, setTraffic] = React.useState<TrafficPoint[] | null>(null);
  const [trafficArea, setTrafficArea] = React.useState<
    TrafficAreaPoint[] | null
  >(null);
  const [recent, setRecent] = React.useState<RecentRow[] | null>(null);
  const [txCount, setTxCount] = React.useState<number>(0); // ✅ เพิ่ม

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardAll({
        year,
        month,
        categoryType: "expense",
      });
      setSummary(res.summary);
      setCategories(res.categories);
      setTraffic(res.trafficMonthly);
      setTrafficArea(res.trafficArea);
      setRecent(res.recent);
      setTxCount(res.txCount ?? 0); // ✅ เก็บค่า
    } catch (e: any) {
      setError(e?.message || "Load dashboard failed");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return {
    year,
    month,
    type,
    setYear,
    setMonth,
    setType,
    summary,
    categories,
    traffic,
    trafficArea,
    recent,
    txCount, // ✅ ส่งออก
    loading,
    error,
    reload,
  };
}
