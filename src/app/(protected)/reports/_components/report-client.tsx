"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReports } from "../_hooks/use-reports";
import { ReportCards } from "./report-cards";
import { ColumnBarChart } from "./column-bar-chart";
import { BarTrendChart } from "./bar-trend-chart";
import { Separator } from "@/components/ui/separator";

export default function ReportClient() {
  const today = new Date();
  const [state, setState] = React.useState<{
    mode: "MONTH" | "RANGE";
    year: number;
    month: number;
    rangeStart?: { year: number; month: number };
    rangeEnd?: { year: number; month: number };
    type: "all" | "income" | "expense";
  }>({
    mode: "MONTH",
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    type: "all",
  });

  const { data, isLoading, isError, refetch } = useReports(state);

  React.useEffect(() => {
    refetch();
  }, [state, refetch]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-semibold">รายงานภาพรวม</h1>
          <p className="text-sm text-muted-foreground">
            สรุปรายรับ–รายจ่าย และหมวดหมู่ ตามตัวกรองที่เลือก
          </p>
        </div>
      </div>

      {/* 2 Columns: Column chart + Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สรุปยอดรวม</CardTitle>
          </CardHeader>
          <CardContent className="pt-10 pb-10">
            <ReportCards
              summary={data?.summary}
              loading={isLoading}
              error={isError}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              เปรียบเทียบรายรับ–รายจ่ายตามเดือน
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ColumnBarChart
              series={data?.monthlySeries ?? []} // ✅ ใช้ชุดรายเดือน
              loading={isLoading}
              error={isError}
              emptyHint="ยังไม่มีข้อมูลรายเดือน"
              height={320}
              defaultRange="12m"
              defaultView="both"
            />
          </CardContent>
        </Card>
      </div>

      {/* Full width: Bar trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            วิเคราะห์หมวดหมู่รายจ่าย (Top / % / ค้นหา)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <BarTrendChart
            series={data?.categorySeries ?? []}
            loading={isLoading}
            error={isError}
            emptyHint="ยังไม่มีข้อมูลหมวดหมู่"
            // ตัวเลือกเริ่มต้น
            defaultMetric="amount" // หรือ "percent"
            // defaultSortBy="amount" // หรือ "percent"
            defaultTopN="10" // 5 / 10 / 15
          />
        </CardContent>
      </Card>

      <Separator />
      {/* <p className="text-xs text-muted-foreground">
        * โหมดช่วงเดือนจำกัดสูงสุด 12 เดือน เพื่อความกระชับและประสิทธิภาพตาม SRS
      </p> */}
    </div>
  );
}
