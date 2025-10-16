// src/app/(protected)/reports/_components/bar-trend-chart.tsx
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

/* ───────────── Types ───────────── */
export type CategoryPoint = { category: string; expense: number };

type Metric = "amount" | "percent";
type SortKey = "amount" | "percent";
type SortDir = "desc" | "asc";
type TopN = "5" | "10" | "15";

/* ───────────── Utils ───────────── */
function formatShort(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("th-TH");
}
function valueTypeToNumber(v: ValueType): number {
  if (Array.isArray(v)) {
    const first = v[0];
    const num = typeof first === "number" ? first : Number(first);
    return Number.isFinite(num) ? num : 0;
  }
  const num = typeof v === "number" ? v : Number(v);
  return Number.isFinite(num) ? num : 0;
}
const vfCurrency: (v: ValueType, n?: NameType) => string = (v) =>
  currencyTooltipValueFormatter(valueTypeToNumber(v));
const vfPercent: (v: ValueType, n?: NameType) => string = (v) =>
  `${valueTypeToNumber(v).toFixed(1)}%`;

function truncateLabel(s: string, max = 26) {
  if (s.length <= max) return s;
  const head = s.slice(0, Math.ceil(max * 0.65));
  const tail = s.slice(-Math.floor(max * 0.25));
  return `${head}…${tail}`;
}
function estimateYAxisWidth(labels: string[]) {
  const maxLen = Math.max(8, ...labels.map((s) => s.length));
  return Math.min(260, Math.max(120, Math.round(maxLen * 7.4) + 34));
}

/** custom tick: ใส่เลขลำดับนำหน้า + ตัดด้วย … + title เต็ม */
function YTick(props: any) {
  const { x, y, payload } = props;
  const full = String(payload?.value ?? "");
  const shown = truncateLabel(full);
  // payload.index คือ index ของแถวหลัง sorting
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

/* ───────────── Component ───────────── */
export function BarTrendChart({
  series,
  loading,
  error,
  emptyHint = "ไม่มีข้อมูล",
  orientation = "row",
  defaultMetric = "amount",
  defaultSortKey = "amount",
  defaultSortDir = "desc",
  defaultTopN = "10",
}: {
  series: CategoryPoint[];
  loading?: boolean;
  error?: boolean;
  emptyHint?: string;
  orientation?: "row" | "column";
  defaultMetric?: Metric;
  defaultSortKey?: SortKey;
  defaultSortDir?: SortDir;
  defaultTopN?: TopN;
}) {
  const [metric, setMetric] = React.useState<Metric>(defaultMetric);
  const [sortKey, setSortKey] = React.useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = React.useState<SortDir>(defaultSortDir);
  const [topN, setTopN] = React.useState<TopN>(defaultTopN);
  const [query, setQuery] = React.useState("");

  /* ── คำนวณข้อมูล (รวม “อื่น ๆ” เมื่อค้นหาไม่เจอ) ── */
  const { rows, total } = React.useMemo(() => {
    const safe = Array.isArray(series) ? series : [];

    // ฐานคิดเปอร์เซ็นต์และ threshold “อื่น ๆ”
    const grandTotal = safe.reduce(
      (acc, r) => acc + Math.max(0, r.expense || 0),
      0
    );

    const filtered = query.trim()
      ? safe.filter((r) =>
          r.category.toLowerCase().includes(query.trim().toLowerCase())
        )
      : safe;

    // กรณีค้นหาแล้วไม่เจอ → รวมหมวดเล็ก (≤10% ของ grandTotal) เป็น “อื่น ๆ”
    if (query.trim() && filtered.length === 0) {
      const threshold = grandTotal * 0.1;
      const othersSum = safe
        .filter((r) => (r.expense || 0) <= threshold)
        .reduce((acc, r) => acc + Math.max(0, r.expense || 0), 0);

      const othersRow =
        othersSum > 0
          ? [
              {
                category: "อื่น ๆ",
                amount: othersSum,
                percent: grandTotal > 0 ? (othersSum * 100) / grandTotal : 0,
              },
            ]
          : [];

      return { rows: othersRow, total: othersSum };
    }

    // โหมดปกติ: เติม amount/percent แล้ว sort + topN
    const withPercent = filtered.map((r) => ({
      category: r.category,
      amount: Math.max(0, r.expense || 0),
      percent: grandTotal > 0 ? (r.expense * 100) / grandTotal : 0,
    }));

    // เรียงด้วยคีย์และทิศทางที่เลือก
    const key = sortKey === "percent" ? "percent" : "amount";
    withPercent.sort((a, b) =>
      sortDir === "desc"
        ? (b as any)[key] - (a as any)[key]
        : (a as any)[key] - (b as any)[key]
    );

    const limited = withPercent.slice(0, Number(topN));

    // total แสดงเฉพาะยอดที่อยู่ในหน้าจอปัจจุบัน (เวลาผู้ใช้เลือก topN)
    const visibleTotal =
      metric === "percent"
        ? limited.reduce((acc, r) => acc + r.percent, 0)
        : limited.reduce((acc, r) => acc + r.amount, 0);

    return { rows: limited, total: visibleTotal };
  }, [series, query, sortKey, sortDir, topN, metric]);

  /* ── Layout responsive ── */
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
          {/* โหมดแสดงผล */}
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

          {/* เรียงตามคีย์ */}
          <Select value={sortKey} onValueChange={(v: SortKey) => setSortKey(v)}>
            <SelectTrigger className="h-8 w-[160px]" aria-label="เรียงตาม">
              <SelectValue placeholder="เรียงตาม" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              <SelectItem value="amount">เรียงตามจำนวนเงิน</SelectItem>
              <SelectItem value="percent">เรียงตามเปอร์เซ็นต์</SelectItem>
            </SelectContent>
          </Select>

          {/* ทิศทางการเรียง: เห็นผลชัดทันที */}
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

        <div className="min-w-[200px] sm:w-[260px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาหมวด เช่น ภาษี (tax)…"
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
            <defs>
              <linearGradient id="cat-expense" x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.85}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.25}
                />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />

            {/* X = ตัวเลข */}
            <XAxis
              type="number"
              tickMargin={8}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={
                metric === "percent"
                  ? (v) => `${valueTypeToNumber(v as ValueType).toFixed(0)}%`
                  : (v) => formatShort(valueTypeToNumber(v as ValueType))
              }
              domain={metric === "percent" ? [0, 100] : ["auto", "auto"]}
            />

            {/* Y = ชื่อหมวด + อันดับ */}
            <YAxis
              type="category"
              dataKey="category"
              interval={0}
              tickMargin={6}
              width={yAxisWidth}
              axisLine={false}
              tickLine={false}
              tick={<YTick />}
            />

            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: 4 }}
              content={
                <CustomTooltip
                  valueFormatter={metric === "percent" ? vfPercent : vfCurrency}
                />
              }
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 6 }}
              payload={[
                {
                  id: metric,
                  value: metric === "percent" ? "สัดส่วน (%)" : "จำนวนเงิน",
                  type: "circle",
                  color: "hsl(var(--chart-2))",
                },
              ]}
            />

            <Bar
              dataKey={metric === "percent" ? "percent" : "amount"}
              name={metric === "percent" ? "สัดส่วน (%)" : "จำนวนเงิน"}
              fill="url(#cat-expense)"
              stroke="hsl(var(--chart-2))"
              radius={[6, 6, 6, 6]}
              maxBarSize={maxBarSize}
              isAnimationActive
            >
              {/* แสดงค่าที่ปลายแท่ง (อ่านง่ายขึ้น) */}
              <LabelList
                dataKey={metric === "percent" ? "percent" : "amount"}
                position="right"
                formatter={(v: any) =>
                  metric === "percent"
                    ? `${valueTypeToNumber(v).toFixed(1)}%`
                    : formatShort(valueTypeToNumber(v))
                }
                className="fill-muted-foreground text-[11px]"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* สรุปย่อย */}
      <div className="mt-2 text-right text-xs text-muted-foreground">
        {metric === "percent"
          ? `สัดส่วนรวมของที่แสดง: ${total.toFixed(1)}%`
          : `รวมรายจ่ายที่แสดง: ${formatShort(total)} บาท`}
      </div>
    </div>
  );
}
