// src/app/(protected)/dashboard/_components/dashboard-client.tsx

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "../_hooks/use-dashboard";
import { DashboardSkeleton } from "./dashboard-skeleton";

/**
 * ✅ DashboardClient
 * -----------------------------------------------------
 * Client Component หลักของหน้า Dashboard
 * - ใช้ dynamic import เพื่อแยกโหลด component แต่ละส่วน (lazy load)
 * - แสดง Skeleton เฉพาะส่วนที่ยังโหลดอยู่
 * - รวมทุกข้อมูลจาก useDashboard() hook
 */

// 🧩 lazy-load components เพื่อ optimize performance
const OverviewCards = dynamic(
  () => import("./overview-cards").then((m) => m.OverviewCards),
  {
    loading: () => <Skeleton className="h-[100px] w-full rounded-xl" />,
    ssr: false,
  }
);
const CategoryDonutChart = dynamic(
  () => import("./category-donut-chart").then((m) => m.CategoryDonutChart),
  {
    loading: () => <Skeleton className="h-[320px] w-full rounded-xl" />,
    ssr: false,
  }
);
const TrafficAreaChart = dynamic(
  () => import("./traffic-area-chart").then((m) => m.TrafficAreaChart),
  {
    loading: () => <Skeleton className="h-[320px] w-full rounded-xl" />,
    ssr: false,
  }
);
const RecentTransactionsTable = dynamic(
  () =>
    import("./recent-transactions-table").then(
      (m) => m.RecentTransactionsTable
    ),
  {
    loading: () => <Skeleton className="h-[400px] w-full rounded-xl" />,
    ssr: false,
  }
);

export default function DashboardClient() {
  // 🔄 ดึงข้อมูลทั้งหมดผ่าน custom hook
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

  // 🟡 Loading state → แสดง skeleton
  if (loading) return <DashboardSkeleton />;

  // 🧮 เตรียมข้อมูลสำหรับ OverviewCards
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
      title: "ยอดคงเหลือเดือนนี้",
      value: summary.balance,
      valueType: "currency" as const,
      accent: "primary" as const,
    },
    {
      id: "txCount",
      title: "จำนวนธุรกรรมเดือนนี้",
      value: txCount,
      valueType: "number" as const,
      accent: "info" as const,
    },
  ];

  // 📑 แปลง recent rows ให้อยู่ในรูปแบบเดียวกับ Table
  const recentRows = (recent ?? []).map((r) => ({
    id: String(r.id),
    date: r.date,
    type: r.type,
    category: r.category ?? r.tag ?? "-",
    amount: Number(r.amount ?? 0) || 0,
    note: r.note ?? "",
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 🧭 Header */}
      <header className="space-y-4">
        <h1 className="text-xl md:text-2xl font-semibold">แดชบอร์ดภาพรวม</h1>
        <p className="text-sm text-muted-foreground">
          สรุปรายรับ–รายจ่าย และรายการล่าสุดของคุณ
        </p>
      </header>

      {/* 💳 สรุปยอดรวม (4 การ์ด) */}
      <OverviewCards items={overviewItems ?? undefined} isLoading={loading} />

      {/* 📈 ส่วนกราฟ */}
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

      {/* 📋 ตารางรายการธุรกรรมล่าสุด */}
      <RecentTransactionsTable rows={recentRows} isLoading={loading} />

      {/* ❗ Error state */}
      {error && (
        <div className="text-sm text-destructive">
          ไม่สามารถโหลดข้อมูลแดชบอร์ด: {String(error)}
        </div>
      )}
    </div>
  );
}
