// src/components/dashboard/category-donut-chart.tsx
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
import type { CategoryRow } from "@/app/(protected)/dashboard/_data/mock";
import {
  CustomTooltip,
  currencyTooltipValueFormatter,
} from "@/components/charts/custom-tooltip";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export interface CategoryDonutChartProps {
  data: CategoryRow[];
  title?: string;
  className?: string;
  isLoading?: boolean;
}

export function CategoryDonutChart({
  data,
  title = "สัดส่วนรายจ่าย",
  className,
  isLoading = false,
}: CategoryDonutChartProps) {
  const total = React.useMemo(
    () => data.reduce((acc, d) => acc + d.value, 0),
    [data]
  );

  const itemsWithPercent = React.useMemo(
    () =>
      total === 0
        ? []
        : data.map((d) => ({
            ...d,
            percent: (d.value / total) * 100,
          })),
    [data, total]
  );

  const hasData = total > 0;

  return (
    <Card className={cn(className)} role="region" aria-label={title}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4">
        {/* กรอบสี่เหลี่ยมจัตุรัสเพื่อให้วงกลม “กลมจริง” */}
        <div className="w-full">
          <div className="mx-auto h-[320px] w-full max-w-[420px]">
            {isLoading ? (
              <div className="flex h-full flex-col justify-end gap-3">
                <Skeleton className="h-[12px] w-32 rounded" />
                <Skeleton className="h-full w-full rounded" />
              </div>
            ) : !hasData ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                ยังไม่มีข้อมูลในช่วงเวลานี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={itemsWithPercent}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                    labelLine={false} // ให้กราฟสะอาด ใช้ legend ข้างล่างแทน
                    isAnimationActive
                  >
                    {itemsWithPercent.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}

                    {/* Center label: Total */}
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        // recharts types กำหนดเป็น Partial; เราเช็คอย่างปลอดภัย
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
