// src/app/(protected)/dashboard/_components/traffic-area-chart.tsx

"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TrafficAreaPoint } from "../_types/dashboard";
import {
  CustomTooltip,
  currencyTooltipValueFormatter,
} from "@/components/charts/custom-tooltip";

/** ───────────────────────────── Types ─────────────────────────────
 *  Range: ระยะเวลาที่แสดง (จำนวนเดือนล่าสุด)
 *  View : มุมมองซีรีส์ข้อมูล (โชว์ทั้งคู่/เฉพาะรายรับ/เฉพาะรายจ่าย)
 */
type Range = "12m" | "6m" | "3m";
type View = "both" | "income" | "expense";

export interface TrafficAreaChartProps {
  /** ชุดข้อมูลแบบ time-series: date(YYYY-MM-01), income, expense */
  data: TrafficAreaPoint[];
  className?: string;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

/** แปลงค่าจำนวนเงินให้สั้น k / M เพื่อแกน Y (อ่านง่ายบนพื้นที่จำกัด) */
function formatBahtShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(
    value
  );
}

/** แปลง YYYY-MM-01 → ชื่อเดือนย่อแบบไทย สำหรับแกน X */
function monthShortTH(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("th-TH", { month: "short" });
}

/** Map ค่าระยะ Range → จำนวนเดือนล่าสุดที่ต้องแสดง */
function rangeToMonths(r: Range) {
  return r === "12m" ? 12 : r === "6m" ? 6 : 3;
}

export function TrafficAreaChart({
  data,
  className,
  isLoading = false,
  title = "แนวโน้มรายรับ–รายจ่าย",
  description = "ย้อนหลังตามช่วงเวลา",
}: TrafficAreaChartProps) {
  /** state: คุมช่วงเวลาและมุมมองซีรีส์ */
  const [timeRange, setTimeRange] = React.useState<Range>("12m");
  const [view, setView] = React.useState<View>("both");

  /** ✅ Memo 1: clone + sort ascending ตาม date เพื่อความถูกต้องของเส้นกราฟ */
  const series = React.useMemo(
    () => (data ?? []).slice().sort((a, b) => a.date.localeCompare(b.date)),
    [data]
  );

  /** ✅ Memo 2: ตัดข้อมูลแค่ N เดือนล่าสุดตาม range (ลดงาน render และทำให้กราฟอ่านง่าย) */
  const filtered = React.useMemo(() => {
    const months = rangeToMonths(timeRange);
    return series.slice(-months);
  }, [series, timeRange]);

  /** มีข้อมูลให้แสดงจริงไหม (กันเคสมีจุด 0 ทั้งหมด) */
  const hasAny =
    filtered.length > 0 && filtered.some((p) => (p.income || p.expense) > 0);

  return (
    <Card className={cn(className)}>
      {/* Header: ชื่อกราฟ + ตัวเลือก range/view (จัดวางให้ยืดหยุ่นบนจอเล็ก) */}
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        {/* Controls: เลือกช่วงเวลา + เลือกซีรีส์ที่จะแสดง (both/income/expense) */}
        <div className="flex items-center gap-2">
          {/* เลือกระยะเวลา (12/6/3 เดือน) — ใช้ Select เพื่อความคุ้นมือและเข้าถึงด้วยคีย์บอร์ดได้ */}
          <Select
            value={timeRange}
            onValueChange={(v: Range) => setTimeRange(v)}
          >
            <SelectTrigger className="h-8 w-[120px]" aria-label="เลือกช่วงเวลา">
              <SelectValue placeholder="ช่วงเวลา" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              <SelectItem value="12m">12 เดือน</SelectItem>
              <SelectItem value="6m">6 เดือน</SelectItem>
              <SelectItem value="3m">3 เดือน</SelectItem>
            </SelectContent>
          </Select>

          {/* ToggleGroup: เลือกมุมมองซีรีส์ — ซ่อนไว้บนจอเล็ก (ใช้ค่า default = both) */}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as View)}
            variant="outline"
            className="hidden sm:flex"
            aria-label="เลือกมุมมองข้อมูล"
          >
            <ToggleGroupItem value="both">ทั้งหมด</ToggleGroupItem>
            <ToggleGroupItem value="income">รายรับ</ToggleGroupItem>
            <ToggleGroupItem value="expense">รายจ่าย</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      {/* Body: ส่วนแสดงกราฟ / สถานะโหลด / สถานะว่าง */}
      <CardContent className="h-[320px]">
        {/* Skeleton: ลด layout shift ขณะโหลด */}
        {isLoading ? (
          <div className="flex h-full flex-col justify-end gap-3">
            <Skeleton className="h-[12px] w-32 rounded" />
            <Skeleton className="h-full w-full rounded" />
          </div>
        ) : !hasAny ? (
          // Empty state: ให้ feedback ชัดเจนเมื่อไม่มีข้อมูลในช่วงเวลาที่เลือก
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            ไม่มีข้อมูลสำหรับช่วงเวลานี้
          </div>
        ) : (
          // กราฟจริง: ใช้ ResponsiveContainer ให้ขยาย/ย่ออัตโนมัติตาม parent
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filtered}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }} // margin น้อยเพื่อใช้พื้นที่วาดกราฟให้คุ้ม
            >
              {/* ── Gradient สำหรับพื้นที่ใต้เส้น (อ่านง่าย + กลมกลืนกับธีม) ── */}
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

              {/* เส้นกริด: เอาแนวนอนพอ (vertical=false) ให้ตาอ่านระดับค่าได้ง่าย */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              {/* แกน X: แสดงเดือนย่อไทย, ลดเส้นแกน/ขีดติ๊ก เพิ่ม space ให้ label ไม่ชนกัน */}
              <XAxis
                dataKey="date"
                tickMargin={8}
                tickFormatter={monthShortTH}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />

              {/* แกน Y: ใช้ short format + ตัดเส้นแกน/ติ๊กเพื่อความมินิมอล */}
              <YAxis
                width={48}
                tickFormatter={(v: number) => formatBahtShort(v)}
                axisLine={false}
                tickLine={false}
                tickMargin={6}
              />

              {/* Tooltip: ใช้ custom formatter เป็นสกุลเงินไทย + cursor dashed ให้โฟกัสจุด */}
              <Tooltip
                cursor={{ stroke: "hsl(var(--border))", strokeDasharray: 4 }}
                content={
                  <CustomTooltip
                    valueFormatter={currencyTooltipValueFormatter}
                  />
                }
              />

              {/* Legend: แสดงชื่อซีรีส์ด้านบน ขวา ไอคอนแบบจุดกลม (อ่านง่าย) */}
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 8 }}
              />

              {/* เส้นรายรับ (โชว์ตาม view) — ใช้สีจาก theme + ปิด dot ลด noise */}
              {(view === "both" || view === "income") && (
                <Area
                  type="monotone"
                  dataKey="income"
                  name="รายรับ"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#income)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }} // เน้นจุดที่ hover
                />
              )}

              {/* เส้นรายจ่าย (โชว์ตาม view) */}
              {(view === "both" || view === "expense") && (
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="รายจ่าย"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#expense)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
