"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
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
import { Input } from "@/components/ui/input";
import { ArrowDown01, ArrowUp10 } from "lucide-react";
import type { CategoryRow } from "../_types/reports";

/* ── Types ───────────────────────────────────────────── */
export type CategoryPoint = CategoryRow; // { category, expense }

type Metric = "amount" | "percent";
type SortDir = "desc" | "asc";
type TopN = "5" | "10" | "15";

/* ── Palette สีชัดเจนไม่ซ้ำ ─────────────────────────── */
const DISTINCT_COLORS = [
  "#22C55E", // 1
  "#EF4444", // 2
  "#3B82F6", // 3
  "#EAB308", // 4
  "#8B5CF6", // 5
  "#14B8A6", // 6
  "#F97316", // 7
  "#06B6D4", // 8
  "#A855F7", // 9
  "#F43F5E", // 10
  "#84CC16", // 11
  "#0EA5E9", // 12
  "#EC4899", // 13
  "#F59E0B", // 14
  "#10B981", // 15
  "#6366F1", // 16
  "#D946EF", // 17
  "#71717A", // 18
  "#FACC15", // 19
  "#FB7185", // 20
  "#0891B2", // 21
  "#BE123C", // 22
  "#4ADE80", // 23
  "#0F766E", // 24
  "#7C3AED", // 25
  "#FDE68A", // 26
  "#0284C7", // 27
  "#F472B6", // 28
  "#94A3B8", // 29
  "#DC2626", // 30
] as const;

/* ── Utils ───────────────────────────────────────────── */

function formatShort(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000)
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("th-TH");
}

/** แปลงค่า ValueType ของ Recharts → number อย่างปลอดภัย */
function valueTypeToNumber(v: ValueType): number {
  if (Array.isArray(v)) {
    const first = v[0];
    const num = typeof first === "number" ? first : Number(first);
    return Number.isFinite(num) ? num : 0;
  }
  const num = typeof v === "number" ? v : Number(v);
  return Number.isFinite(num) ? num : 0;
}

/** ฟอร์แมต tooltip */
const vfCurrency: (v: ValueType, n?: NameType) => string = (v) =>
  currencyTooltipValueFormatter(valueTypeToNumber(v));
const vfPercent: (v: ValueType, n?: NameType) => string = (v) =>
  `${valueTypeToNumber(v).toFixed(1)}%`;

/** truncate label */
function truncateLabel(s: string, max = 26) {
  if (s.length <= max) return s;
  const head = s.slice(0, Math.ceil(max * 0.65));
  const tail = s.slice(-Math.floor(max * 0.25));
  return `${head}…${tail}`;
}

/** ประมาณความกว้างแกน Y */
function estimateYAxisWidth(labels: string[]) {
  const maxLen = Math.max(8, ...labels.map((s) => s.length));
  return Math.min(260, Math.max(120, Math.round(maxLen * 7.4) + 34));
}

/** Tick ของแกน Y */
type RawTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string | number; index?: number };
};
const renderYTick = (p: RawTickProps) => (
  <YTick
    x={p.x ?? 0}
    y={p.y ?? 0}
    payload={{
      value: p.payload?.value ?? "",
      index: p.payload?.index,
    }}
  />
);
function YTick({ x, y, payload }: RawTickProps) {
  const full = String(payload?.value ?? "");
  const shown = truncateLabel(full);
  const rank =
    typeof payload?.index === "number" ? payload.index + 1 : undefined;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dominantBaseline="central"
        textAnchor="end"
        fill="currentColor"
        fontSize={12}
      >
        <title>{full}</title>
        {rank ? `${rank}. ` : ""}
        {shown}
      </text>
    </g>
  );
}

/* ── Component ───────────────────────────────────────── */
export function BarTrendChart({
  series,
  loading,
  error,
  emptyHint = "ไม่มีข้อมูล",
  defaultMetric = "amount",
  defaultSortDir = "desc",
  defaultTopN = "10",
}: {
  series: CategoryPoint[];
  loading?: boolean;
  error?: boolean;
  emptyHint?: string;
  defaultMetric?: Metric;
  defaultSortDir?: SortDir;
  defaultTopN?: TopN;
}) {
  const [metric, setMetric] = React.useState<Metric>(defaultMetric);
  const [sortDir, setSortDir] = React.useState<SortDir>(defaultSortDir);
  const [topN, setTopN] = React.useState<TopN>(defaultTopN);
  const [query, setQuery] = React.useState("");

  // 1) เตรียมข้อมูลที่จะแสดงในกราฟ (rows)
  const { rows, total } = React.useMemo(() => {
    const safe = Array.isArray(series) ? series : [];
    const grandTotal = safe.reduce(
      (acc, r) => acc + Math.max(0, r.expense || 0),
      0
    );

    const filtered = query.trim()
      ? safe.filter((r) =>
          r.category.toLowerCase().includes(query.trim().toLowerCase())
        )
      : safe;

    // เคสค้นหาแล้วไม่เจอ -> รวมหมวดเล็ก ๆ เป็น "อื่น ๆ"
    if (query.trim() && filtered.length === 0) {
      const threshold = grandTotal * 0.1;
      const othersSum = safe
        .filter((r) => (r.expense || 0) <= threshold)
        .reduce((acc, r) => acc + Math.max(0, r.expense || 0), 0);

      const others =
        othersSum > 0
          ? [
              {
                category: "อื่น ๆ",
                amount: othersSum,
                percent: grandTotal > 0 ? (othersSum * 100) / grandTotal : 0,
              },
            ]
          : [];

      return { rows: others, total: othersSum };
    }

    // เติม amount / percent
    const withPercent = filtered.map((r) => ({
      category: r.category,
      amount: Math.max(0, r.expense || 0),
      percent: grandTotal > 0 ? ((r.expense || 0) * 100) / grandTotal : 0,
    }));

    // sort ตาม metric ปัจจุบัน
    const sorted = [...withPercent].sort((a, b) => {
      const av = metric === "percent" ? a.percent : a.amount;
      const bv = metric === "percent" ? b.percent : b.amount;
      if (av === bv) return a.category.localeCompare(b.category, "th");
      return sortDir === "desc" ? bv - av : av - bv;
    });

    // จำกัด topN
    const limited = sorted.slice(0, Number(topN));

    // รวมผลรวมของสิ่งที่แสดง (เอาไว้สรุปด้านล่าง)
    const visibleTotal =
      metric === "percent"
        ? limited.reduce((acc, r) => acc + r.percent, 0)
        : limited.reduce((acc, r) => acc + r.amount, 0);

    return { rows: limited, total: visibleTotal };
  }, [series, query, sortDir, topN, metric]);

  // 2) map category -> สีถาวรของแท่ง
  const colorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    let colorIndex = 0;
    for (const r of rows) {
      const cat = r.category;
      if (map[cat] === undefined) {
        map[cat] = DISTINCT_COLORS[colorIndex % DISTINCT_COLORS.length];
        colorIndex++;
      }
    }
    return map;
  }, [rows]);

  // 3) layout dynamic สูงตามจำนวนแถว
  const rowHeight = 36;
  const controlsH = 64;
  const baseMin = 300;
  const height = Math.max(
    baseMin,
    controlsH + rowHeight * Math.max(rows.length, 4)
  );
  const maxBarSize = rows.length <= 5 ? 30 : rows.length <= 10 ? 26 : 22;

  if (loading) return <Skeleton className="w-full" style={{ height }} />;
  if (error)
    return (
      <div className="text-sm text-destructive">
        ไม่สามารถโหลดข้อมูลหมวดหมู่ได้
      </div>
    );
  if (!rows.length)
    return <div className="text-sm text-muted-foreground">{emptyHint}</div>;

  const yAxisWidth = estimateYAxisWidth(rows.map((r) => r.category));

  return (
    <div className="flex w-full flex-col overflow-hidden" style={{ height }}>
      {/* Controls */}
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* เลือก metric แสดงผล (จำนวนเงิน / %) */}
          <ToggleGroup
            type="single"
            value={metric}
            onValueChange={(v) => v && setMetric(v as Metric)}
            variant="outline"
            aria-label="โหมดแสดงผล"
          >
            <ToggleGroupItem value="amount">จำนวนเงิน</ToggleGroupItem>
            <ToggleGroupItem value="percent">เปอร์เซ็นต์</ToggleGroupItem>
          </ToggleGroup>

          {/* เรียง มาก→น้อย / น้อย→มาก */}
          <ToggleGroup
            type="single"
            value={sortDir}
            onValueChange={(v) => v && setSortDir(v as SortDir)}
            variant="outline"
            aria-label="ทิศทางการเรียง"
          >
            <ToggleGroupItem
              value="desc"
              aria-label="มากไปน้อย"
              title="มาก → น้อย"
            >
              <ArrowDown01 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="asc"
              aria-label="น้อยไปมาก"
              title="น้อย → มาก"
            >
              <ArrowUp10 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Top N */}
          <Select value={topN} onValueChange={(v: TopN) => setTopN(v)}>
            <SelectTrigger className="h-8 w-[106px]" aria-label="เลือก Top N">
              <SelectValue placeholder="Top N" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="15">Top 15</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ช่องค้นหา */}
        <div className="min-w-[200px] sm:w-[260px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาหมวด เช่น อาหาร/ค่าจ้าง…"
            className="h-8"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            barGap={6}
            barCategoryGap={8}
            margin={{ top: 16, right: 16, bottom: 16, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />

            <XAxis
              type="number"
              tickMargin={8}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={
                metric === "percent"
                  ? (v) =>
                      `${valueTypeToNumber(v as ValueType).toFixed(0)}%`
                  : (v) => formatShort(valueTypeToNumber(v as ValueType))
              }
              domain={metric === "percent" ? [0, 100] : ["auto", "auto"]}
            />

            <YAxis
              type="category"
              dataKey="category"
              interval={0}
              tickMargin={6}
              width={yAxisWidth}
              axisLine={false}
              tickLine={false}
              tick={renderYTick}
            />

            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: 4 }}
              content={
                <CustomTooltip
                  valueFormatter={
                    metric === "percent" ? vfPercent : vfCurrency
                  }
                />
              }
            />

            <Bar
              dataKey={metric === "percent" ? "percent" : "amount"}
              name={metric === "percent" ? "สัดส่วน (%)" : "จำนวนเงิน"}
              radius={[6, 6, 6, 6]}
              maxBarSize={maxBarSize}
              isAnimationActive
            >
              {rows.map((row, i) => (
                <Cell
                  key={`bar-${row.category}-${i}`}
                  fill={colorMap[row.category]}
                  stroke={colorMap[row.category]}
                />
              ))}

              <LabelList
                dataKey={metric === "percent" ? "percent" : "amount"}
                position="right"
                formatter={(v: unknown) =>
                  metric === "percent"
                    ? `${valueTypeToNumber(v as ValueType).toFixed(1)}%`
                    : formatShort(valueTypeToNumber(v as ValueType))
                }
                className="fill-muted-foreground text-[11px]"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* summary footer */}
      <div className="mt-2 text-right text-xs text-muted-foreground">
        {metric === "percent"
          ? `สัดส่วนรวมของที่แสดง: ${total.toFixed(1)}%`
          : `รวมรายจ่ายที่แสดง: ${formatShort(total)} บาท`}
      </div>
    </div>
  );
}
