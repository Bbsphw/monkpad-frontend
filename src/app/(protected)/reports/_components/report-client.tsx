// src/app/(protected)/reports/_components/report-client.tsx

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useReports } from "../_hooks/use-reports";
import { ReportSkeleton } from "./report-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/* ───────────────────────────── Lazy Imports ─────────────────────────────
 * - ใช้ dynamic import เพื่อแยกโหลดเฉพาะ component ที่มีน้ำหนักมาก (charts/UI)
 * - ลด initial JS bundle → โหลดเฉพาะเมื่อผู้ใช้เข้า "Reports" จริง ๆ
 * - แต่ละ component มี skeleton ของตัวเองแสดงระหว่างโหลด
 */

// การ์ดสรุปยอดรวม (ใช้ carousel)
const ReportCards = dynamic(
  () => import("./report-cards").then((m) => m.ReportCards),
  {
    loading: () => (
      <div className="p-4">
        <ReportCardsSkeleton />
      </div>
    ),
    ssr: false, // ปิด SSR เพื่อโหลดเฉพาะ client
  }
);

// กราฟแท่งแนวตั้ง: รายรับ/รายจ่ายรายเดือน
const ColumnBarChart = dynamic(
  () => import("./column-bar-chart").then((m) => m.ColumnBarChart),
  {
    loading: () => <Skeleton className="h-[320px] w-full rounded-xl" />,
    ssr: false,
  }
);

// กราฟแท่งแนวนอน: สรุปหมวดหมู่รายจ่าย
const BarTrendChart = dynamic(
  () => import("./bar-trend-chart").then((m) => m.BarTrendChart),
  {
    loading: () => <Skeleton className="h-[400px] w-full rounded-xl" />,
    ssr: false,
  }
);

/* ───────────────────────────── Skeleton Placeholder ─────────────────────────────
 * ใช้ระหว่างโหลด ReportCards (สรุปยอด)
 * - คง layout เดิม (grid 2x2) เพื่อลด layout shift
 * - สีเทา muted รองรับ dark mode
 */
function ReportCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[160px] rounded-xl border bg-muted/30 animate-pulse dark:bg-muted/10"
        />
      ))}
    </div>
  );
}

/* ───────────────────────────── Main Component ─────────────────────────────
 * ReportClient
 * -------------------------------------------------------------
 * ใช้เป็น client entry สำหรับหน้า /reports
 * รวมการเรียกข้อมูลทั้งหมด (ผ่าน useReports) และเรนเดอร์เป็น layout ของหน้า
 * Features:
 *  ✅ Lazy-load ชิ้นส่วนกราฟ/การ์ด
 *  ✅ ใช้ SWR cache-friendly hook (useReports)
 *  ✅ มี skeleton / error handling / empty state ครบ
 */
export default function ReportClient() {
  // ── ค่าปีและเดือนปัจจุบัน ใช้เป็น default query ──
  const today = new Date();
  const [year, setYear] = React.useState<number>(today.getFullYear());
  const [month, setMonth] = React.useState<number>(today.getMonth() + 1);
  const [type] = React.useState<"income" | "expense" | "all">("all");

  // ── เรียก custom hook (useReports) ──
  // ใช้ SWR ดึงข้อมูลทั้งหมด (summary, monthlySeries, categorySeries)
  // จะ revalidate อัตโนมัติถ้า key (year, month, type) เปลี่ยน
  const { data, loading, error } = useReports({ year, month, type });

  // ── Loading state (โหลดครั้งแรก) ──
  if (loading) return <ReportSkeleton />;

  // ───────────────────────────── Layout ─────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ─── Header ─── */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-semibold">รายงานภาพรวม</h1>
          <p className="text-sm text-muted-foreground">
            สรุปรายรับ–รายจ่าย และหมวดหมู่ จากข้อมูลธุรกรรมของคุณ
          </p>
        </div>
      </header>

      {/* ─── Section 1: Summary + Monthly Comparison ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* สรุปยอดรวม */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สรุปยอดรวม</CardTitle>
          </CardHeader>
          <CardContent className="pt-10 pb-10">
            <ReportCards
              summary={data?.summary}
              loading={loading}
              error={!!error}
            />
          </CardContent>
        </Card>

        {/* เปรียบเทียบรายรับ–รายจ่ายรายเดือน */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              เปรียบเทียบรายรับ–รายจ่ายรายเดือน
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ColumnBarChart
              series={data?.monthlySeries ?? []}
              loading={loading}
              error={!!error}
              emptyHint="ยังไม่มีข้อมูลรายเดือน"
              height={320}
              defaultRange="12m"
              defaultView="both"
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── Section 2: Category Analysis ─── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            วิเคราะห์หมวดหมู่รายจ่าย (Top / % / ค้นหา)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <BarTrendChart
            series={data?.categorySeries ?? []}
            loading={loading}
            error={!!error}
            emptyHint="ยังไม่มีข้อมูลหมวดหมู่"
            defaultMetric="amount"
            defaultTopN="10"
          />
        </CardContent>
      </Card>

      {/* ─── Footer / Error separator ─── */}
      <Separator />

      {/* แสดงข้อความ error เพิ่มเติม (หากมี) */}
      {error && (
        <div className="text-sm text-destructive">
          โหลดข้อมูลรายงานไม่สำเร็จ: {String(error)}
        </div>
      )}
    </div>
  );
}
