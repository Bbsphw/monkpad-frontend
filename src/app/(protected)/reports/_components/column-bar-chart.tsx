// src/app/(protected)/reports/_components/column-bar-chart.tsx

"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CustomTooltip,
  currencyTooltipValueFormatter,
} from "@/components/charts/custom-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MonthlyPoint } from "../_types/reports";

/* ──────────────────────────────── Types ──────────────────────────────── */
/**
 * View: ตัวเลือกมุมมองข้อมูลในกราฟ
 *  - both: แสดงรายรับ + รายจ่ายพร้อมกัน
 *  - income: แสดงเฉพาะรายรับ
 *  - expense: แสดงเฉพาะรายจ่าย
 *
 * Range: จำนวนเดือนย้อนหลังที่ต้องการแสดง (ใช้ใน filter)
 *  - 12m, 6m, 3m
 */
type View = "both" | "income" | "expense";
type Range = "12m" | "6m" | "3m";

/* ──────────────────────────────── Utils ──────────────────────────────── */

/** ชื่อเดือนย่อแบบไทย (ใช้ map กับข้อมูลเดือนที่มาจาก backend) */
const TH_MONTH_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** ย่อค่าตัวเลขให้สั้น เช่น 12.3k / 1.2M */
function formatShort(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("th-TH");
}

/** แปลง Range → จำนวนเดือนจริง */
const rangeToMonths = (r: Range) => (r === "12m" ? 12 : r === "6m" ? 6 : 3);

/**
 * แปลง label เดือนให้เป็นภาษาไทย:
 *  รองรับทั้งรูปแบบ "01/25", "2025-01", หรือ "Jan"/"January"
 */
function parseThaiMonthLabel(raw: string): string {
  if (!raw) return "-";
  const clean = raw.trim();

  // รูปแบบ "01/25" หรือ "1-25"
  const matchDMY = clean.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
  if (matchDMY) {
    const m = parseInt(matchDMY[1], 10);
    return TH_MONTH_SHORT[m - 1] ?? clean;
  }

  // รูปแบบ ISO "2025-01"
  const matchISO = clean.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (matchISO) {
    const m = parseInt(matchISO[2], 10);
    return TH_MONTH_SHORT[m - 1] ?? clean;
  }

  // แปลงชื่อเดือนอังกฤษ → ไทย
  const engToTh: Record<string, string> = {
    jan: "ม.ค.",
    feb: "ก.พ.",
    mar: "มี.ค.",
    apr: "เม.ย.",
    may: "พ.ค.",
    jun: "มิ.ย.",
    jul: "ก.ค.",
    aug: "ส.ค.",
    sep: "ก.ย.",
    oct: "ต.ค.",
    nov: "พ.ย.",
    dec: "ธ.ค.",
  };
  const found = Object.entries(engToTh).find(([k]) =>
    clean.toLowerCase().includes(k)
  );
  return found ? found[1] : clean;
}

/* ─────────────────────────────── Component ─────────────────────────────── */

/**
 * ColumnBarChart
 * ───────────────────────────────────────────────
 * แสดงกราฟแท่งแนวตั้งของรายรับ/รายจ่ายรายเดือน
 * ใช้ในหน้า “รายงาน (Reports)” เพื่อสรุปแนวโน้มเดือนต่อเดือน
 *
 * Features:
 *  ✅ เลือกช่วงเวลา (12 / 6 / 3 เดือน)
 *  ✅ เลือกเดือนสิ้นสุด
 *  ✅ Toggle รายรับ / รายจ่าย / ทั้งหมด
 *  ✅ Loading skeleton / error / empty state ครบ
 */
export function ColumnBarChart({
  series,
  loading,
  error,
  emptyHint = "ไม่มีข้อมูล",
  height = 320,
  defaultRange = "12m",
  defaultView = "both",
}: {
  series: MonthlyPoint[] | undefined; // [{ month, income, expense }]
  loading?: boolean;
  error?: boolean;
  emptyHint?: string;
  height?: number;
  defaultRange?: Range;
  defaultView?: View;
}) {
  /* ─────────────── Normalize ข้อมูลต้นทาง ─────────────── */
  // กรองเฉพาะข้อมูลที่มี month ถูกต้อง
  const ordered = React.useMemo(
    () =>
      Array.isArray(series)
        ? series.filter(
            (d): d is MonthlyPoint => !!d && typeof d.month === "string"
          )
        : [],
    [series]
  );

  /* ─────────────── State ─────────────── */
  const [view, setView] = React.useState<View>(defaultView);
  const [range, setRange] = React.useState<Range>(defaultRange);
  const [endIndex, setEndIndex] = React.useState<number>(
    Math.max(0, ordered.length - 1)
  );

  // reset endIndex เมื่อข้อมูลใหม่เข้ามา
  React.useEffect(() => {
    setEndIndex(Math.max(0, ordered.length - 1));
  }, [ordered.length]);

  /* ─────────────── คำนวณข้อมูลที่จะนำมาแสดง ─────────────── */
  const data = React.useMemo(() => {
    if (!ordered.length) return [];

    const n = rangeToMonths(range);
    const end = Math.min(endIndex, ordered.length - 1);
    const start = Math.max(0, end - (n - 1));

    // slice เฉพาะช่วงเดือนที่เลือก + แปลงชื่อเดือน
    return ordered.slice(start, end + 1).map((d) => ({
      month: parseThaiMonthLabel(d.month),
      income: view === "expense" ? 0 : d.income,
      expense: view === "income" ? 0 : d.expense,
    }));
  }, [ordered, endIndex, range, view]);

  const hasIncome = data.some((r) => (r.income ?? 0) > 0);
  const hasExpense = data.some((r) => (r.expense ?? 0) > 0);

  /* ─────────────── Loading / Error / Empty ─────────────── */
  if (loading) return <Skeleton className="w-full" style={{ height }} />;
  if (error)
    return (
      <div className="text-sm text-destructive">ไม่สามารถโหลดกราฟรายเดือน</div>
    );
  if (!data.length)
    return <div className="text-sm text-muted-foreground">{emptyHint}</div>;

  /* ─────────────── Rendering ─────────────── */
  return (
    <div className="flex w-full flex-col" style={{ height }}>
      {/* ─── Controls ด้านบน ─── */}
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* ตัวเลือกช่วงเวลา (Range) */}
          <Select value={range} onValueChange={(v: Range) => setRange(v)}>
            <SelectTrigger className="h-8 w-[140px]" aria-label="เลือกช่วงเวลา">
              <SelectValue placeholder="ช่วงเวลา" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              <SelectItem value="12m">12 เดือนล่าสุด</SelectItem>
              <SelectItem value="6m">6 เดือนล่าสุด</SelectItem>
              <SelectItem value="3m">3 เดือนล่าสุด</SelectItem>
            </SelectContent>
          </Select>

          {/* ตัวเลือกเดือนสิ้นสุด (endIndex mapping → month) */}
          <Select
            value={String(endIndex)}
            onValueChange={(v) => setEndIndex(Number(v))}
          >
            <SelectTrigger
              className="h-8 w-[160px]"
              aria-label="เลือกเดือนสิ้นสุด"
            >
              <SelectValue placeholder="เดือนสิ้นสุด" />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="max-h-64 overflow-auto rounded-xl"
            >
              {ordered.map((d, i) => (
                <SelectItem key={`${d.month}-${i}`} value={String(i)}>
                  {parseThaiMonthLabel(d.month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggle มุมมองข้อมูล */}
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as View)}
          variant="outline"
          aria-label="เลือกมุมมองข้อมูล"
        >
          <ToggleGroupItem value="both">ทั้งหมด</ToggleGroupItem>
          <ToggleGroupItem value="income">รายรับ</ToggleGroupItem>
          <ToggleGroupItem value="expense">รายจ่าย</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* ─── กราฟ ─── */}
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6} barCategoryGap={10}>
            {/* Gradient Fill สำหรับสีแท่ง */}
            <defs>
              <linearGradient id="m-income" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.9}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.2}
                />
              </linearGradient>
              <linearGradient id="m-expense" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.9}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>

            {/* กริด / แกน X / แกน Y */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickMargin={8}
              axisLine={false}
              tickLine={false}
              minTickGap={14}
            />
            <YAxis
              tickMargin={6}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => formatShort(v)}
            />

            {/* Tooltip และ Legend */}
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: 4 }}
              content={
                <CustomTooltip valueFormatter={currencyTooltipValueFormatter} />
              }
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 6 }}
            />

            {/* Bar สำหรับรายรับ/รายจ่าย */}
            {hasIncome && (
              <Bar
                dataKey="income"
                name="รายรับ"
                fill="url(#m-income)"
                stroke="hsl(var(--chart-1))"
              />
            )}
            {hasExpense && (
              <Bar
                dataKey="expense"
                name="รายจ่าย"
                fill="url(#m-expense)"
                stroke="hsl(var(--chart-2))"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
