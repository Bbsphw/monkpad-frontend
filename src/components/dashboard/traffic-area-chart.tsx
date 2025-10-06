// src/components/dashboard/traffic-area-chart.tsx
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
import type { TrafficRow } from "@/app/(protected)/dashboard/_data/mock";
import {
  CustomTooltip,
  currencyTooltipValueFormatter,
} from "@/components/charts/custom-tooltip";
import { cn } from "@/lib/utils";

/* ----------------------------- types & utils ----------------------------- */

type Range = "12m" | "6m" | "3m";
type View = "both" | "income" | "expense";

function formatBahtShort(value: number): string {
  // 1,000 -> 1k / 1,000,000 -> 1M (อ่านง่าย)
  const abs = Math.abs(value);
  if (abs >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(
    value
  );
}

function monthShortTH(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("th-TH", { month: "short" });
}

function rangeToMonths(r: Range): number {
  return r === "12m" ? 12 : r === "6m" ? 6 : 3;
}

/* -------------------------------- component ------------------------------ */

export interface TrafficAreaChartProps {
  data: TrafficRow[];
  className?: string;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function TrafficAreaChart({
  data,
  className,
  isLoading = false,
  title = "แนวโน้มรายรับ–รายจ่าย",
  description = "ย้อนหลังตามช่วงเวลา",
}: TrafficAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState<Range>("12m");
  const [view, setView] = React.useState<View>("both");

  const filtered = React.useMemo(() => {
    const months = rangeToMonths(timeRange);
    return data.slice(-months);
  }, [data, timeRange]);

  const hasData = filtered.length > 0;

  return (
    <Card className={cn(className)}>
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {/* เลือกช่วงเวลา */}
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

          {/* เลือกมุมมอง */}
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

      <CardContent className="h-[320px]">
        {isLoading ? (
          <div className="flex h-full flex-col justify-end gap-3">
            <Skeleton className="h-[12px] w-32 rounded" />
            <Skeleton className="h-full w-full rounded" />
          </div>
        ) : !hasData ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            ไม่มีข้อมูลสำหรับช่วงเวลานี้
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filtered}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
            >
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

              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="date"
                tickMargin={8}
                tickFormatter={monthShortTH}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />

              <YAxis
                width={48}
                tickFormatter={(v: number) => formatBahtShort(v)}
                axisLine={false}
                tickLine={false}
                tickMargin={6}
              />

              <Tooltip
                cursor={{ stroke: "hsl(var(--border))", strokeDasharray: 4 }}
                content={
                  <CustomTooltip
                    valueFormatter={currencyTooltipValueFormatter}
                  />
                }
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 8 }}
              />

              {(view === "both" || view === "income") && (
                <Area
                  type="monotone"
                  dataKey="income"
                  name="รายรับ"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#income)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              )}

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
