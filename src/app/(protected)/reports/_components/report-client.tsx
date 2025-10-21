// src/app/(protected)/reports/_components/report-client.tsx

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useReports } from "../_hooks/use-reports";
import { ReportSkeleton } from "./report-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ lazy-load เฉพาะชิ้นหนัก ๆ ในฝั่ง client
const ReportCards = dynamic(
  () => import("./report-cards").then((m) => m.ReportCards),
  {
    loading: () => (
      <div className="p-4">
        <ReportCardsSkeleton />
      </div>
    ),
    ssr: false,
  }
);
const ColumnBarChart = dynamic(
  () => import("./column-bar-chart").then((m) => m.ColumnBarChart),
  {
    loading: () => <Skeleton className="h-[320px] w-full rounded-xl" />,
    ssr: false,
  }
);
const BarTrendChart = dynamic(
  () => import("./bar-trend-chart").then((m) => m.BarTrendChart),
  {
    loading: () => <Skeleton className="h-[400px] w-full rounded-xl" />,
    ssr: false,
  }
);

function ReportCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[160px] rounded-xl border bg-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function ReportClient() {
  const today = new Date();
  const [year, setYear] = React.useState<number>(today.getFullYear());
  const [month, setMonth] = React.useState<number>(today.getMonth() + 1);
  const [type] = React.useState<"income" | "expense" | "all">("all");

  const { data, loading, error, reload } = useReports({ year, month, type });

  React.useEffect(() => {
    void reload();
  }, [year, month, type, reload]);

  if (loading) return <ReportSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-semibold">รายงานภาพรวม</h1>
          <p className="text-sm text-muted-foreground">
            สรุปรายรับ–รายจ่าย และหมวดหมู่ จากข้อมูลธุรกรรมของคุณ
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      <Separator />

      {error && (
        <div className="text-sm text-destructive">
          โหลดข้อมูลรายงานไม่สำเร็จ: {String(error)}
        </div>
      )}
    </div>
  );
}
