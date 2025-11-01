// src/app/(protected)/dashboard/_components/category-donut-chart.tsx

"use client";

import * as React from "react";
import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryRow } from "../_types/dashboard";
import {
  CustomTooltip,
  currencyTooltipValueFormatter,
} from "@/components/charts/custom-tooltip";
import { cn } from "@/lib/utils";

/** 🎨 ชุดสีหลักสำหรับ PieChart ดึงจาก CSS variable เพื่อรองรับ dark mode */
// const COLORS = [
//   "hsl(var(--chart-1))",
//   "hsl(var(--chart-2))",
//   "hsl(var(--chart-3))",
//   "hsl(var(--chart-4))",
//   "hsl(var(--chart-5))",
// ] as const;

/** 💰 ฟังก์ชัน format เงินเป็นบาท (ไม่แสดงทศนิยม) */
function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export const DISTINCT_COLORS = [
  "#6495ED",
  "#FFDAB9",
  "#3B82F6",
  "#EAB308",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
  "#A855F7",
  "#F43F5E",
  "#84CC16",
  "#0EA5E9",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#6366F1",
  "#D946EF",
  "#71717A",
  "#FACC15",
  "#FB7185",
  "#0891B2",
  "#BE123C",
  "#4ADE80",
  "#0F766E",
  "#7C3AED",
  "#FDE68A",
  "#0284C7",
  "#F472B6",
  "#94A3B8",
  "#DC2626",
] as const;

export interface CategoryDonutChartProps {
  data: CategoryRow[];
  title?: string;
  className?: string;
  isLoading?: boolean;
}

/**
 * ✅ Component: CategoryDonutChart
 * -------------------------------------------------------------
 * แสดงสัดส่วนรายจ่าย (หมวดหมู่) ในรูปแบบโดนัทกราฟ
 * มีสถานะ loading / empty / filled
 */
export function CategoryDonutChart({
  data,
  title = "สัดส่วนรายจ่าย",
  className,
  isLoading = false,
}: CategoryDonutChartProps) {
  // 🔢 รวมยอดทั้งหมด เพื่อคำนวณเปอร์เซ็นต์ภายหลัง
  const total = React.useMemo(
    () => data.reduce((acc, d) => acc + (Number(d.expense) || 0), 0),
    [data]
  );

  // 📊 คำนวณเปอร์เซ็นต์ต่อหมวด ถ้ามีข้อมูล
  const withPercent = React.useMemo(
    () =>
      total === 0
        ? []
        : data.map((d) => ({
            ...d,
            percent: ((Number(d.expense) || 0) / total) * 100,
          })),
    [data, total]
  );

  const colorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    let colorIndex = 0;

    for (const row of withPercent) {
      const cat = row.category;
      if (map[cat] === undefined) {
        map[cat] = DISTINCT_COLORS[colorIndex % DISTINCT_COLORS.length];
        colorIndex++;
      }
    }

    return map;
  }, [withPercent]);

  const hasData = total > 0;

  return (
    <Card className={cn(className)} role="region" aria-label={title}>
      {/* ส่วนหัวของการ์ด */}
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4">
        <div className="w-full">
          <div className="mx-auto h-[320px] w-full max-w-[420px]">
            {/* 🟡 สถานะ Loading → แสดง Skeleton */}
            {isLoading ? (
              <div className="flex h-full flex-col justify-end gap-3">
                <Skeleton className="h-[12px] w-32 rounded" />
                <Skeleton className="h-full w-full rounded" />
              </div>
            ) : !hasData ? (
              // ⚪ ไม่มีข้อมูล → แสดงข้อความ placeholder
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                ยังไม่มีข้อมูลในช่วงเวลานี้
              </div>
            ) : (
              // 🟢 แสดงโดนัทกราฟเมื่อมีข้อมูล
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={withPercent}
                    dataKey="expense" // ใช้ expense เป็น value หลัก
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                    labelLine={false}
                    isAnimationActive
                  >
                    {/* 🔵 ใส่สีตาม index */}
                    {withPercent.map((row, i) => (
                      <Cell
                        key={row.category ?? i}
                        fill={colorMap[row.category]}
                      />
                    ))}
                    {/* 🧮 แสดง label “รวมยอดทั้งหมด” ที่กึ่งกลางวง */}
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        if (
                          viewBox &&
                          "cx" in viewBox &&
                          "cy" in viewBox &&
                          typeof viewBox.cx === "number" &&
                          typeof viewBox.cy === "number"
                        ) {
                          const cx = viewBox.cx;
                          const cy = viewBox.cy;
                          return (
                            <g>
                              <text
                                x={cx}
                                y={cy - 8}
                                textAnchor="middle"
                                className="fill-foreground text-sm font-medium"
                              >
                                รวม
                              </text>
                              <text
                                x={cx}
                                y={cy + 14}
                                textAnchor="middle"
                                className="fill-foreground text-base font-semibold"
                              >
                                {formatBaht(total)}
                              </text>
                            </g>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>

                  {/* 🪶 Tooltip แบบ custom */}
                  <Tooltip
                    cursor={false}
                    content={
                      <CustomTooltip
                        valueFormatter={currencyTooltipValueFormatter}
                        labelFormatter={() => "สัดส่วนรายจ่าย"}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
