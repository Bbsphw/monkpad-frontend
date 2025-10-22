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
import type { CategoryRow } from "../_types/reports";

/* ───────────────────────────── Types ─────────────────────────────
 * - CategoryPoint: series ที่เข้ามาจากภายนอก ใช้โครงเดียวกับ CategoryRow
 * - Metric: โหมดการแสดงผล (จำนวนเงิน/เปอร์เซ็นต์)
 * - SortDir/TopN: ตัวเลือกการเรียงและจำนวน Top N
 *   (ปัจจุบัน sortKey ถูกปิดไว้ด้วยคอมเมนต์เพราะยังไม่เปิดใช้)
 */
export type CategoryPoint = CategoryRow; // { category, expense }

type Metric = "amount" | "percent";
type SortKey = "amount" | "percent";
type SortDir = "desc" | "asc";
type TopN = "5" | "10" | "15";

/* ───────────────────────────── Utils ───────────────────────────── */

/** ย่อจำนวนเงินให้อ่านง่าย (เช่น 12.3k / 1.2M) */
function formatShort(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
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

/** ฟอร์แมต tooltip แบบสกุลเงิน (ใช้ตัวช่วยกลางจาก custom-tooltip) */
const vfCurrency: (v: ValueType, n?: NameType) => string = (v) =>
  currencyTooltipValueFormatter(valueTypeToNumber(v));

/** ฟอร์แมต tooltip แบบเปอร์เซ็นต์ */
const vfPercent: (v: ValueType, n?: NameType) => string = (v) =>
  `${valueTypeToNumber(v).toFixed(1)}%`;

/** ตัดข้อความ label ด้านแกน Y ให้สั้นลง แต่ยังคงส่วนหัว-ท้ายไว้ */
function truncateLabel(s: string, max = 26) {
  if (s.length <= max) return s;
  const head = s.slice(0, Math.ceil(max * 0.65));
  const tail = s.slice(-Math.floor(max * 0.25));
  return `${head}…${tail}`;
}

/** ประมาณความกว้างแกน Y จากความยาวข้อความ (ให้ไม่ชน/ตัดคำ) */
function estimateYAxisWidth(labels: string[]) {
  const maxLen = Math.max(8, ...labels.map((s) => s.length));
  return Math.min(260, Math.max(120, Math.round(maxLen * 7.4) + 34));
}

/** Tick Renderer ของแกน Y: ใส่ลำดับ (rank) + title เป็น full text (hover) */
function YTick(props: any) {
  const { x, y, payload } = props;
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

/* ─────────────────────────── Component ──────────────────────────
 * BarTrendChart:
 * - แสดง Top N ของหมวดหมู่ (ค่า expense) แบบกราฟแท่งแนวนอน
 * - สลับมุมมองได้: จำนวนเงิน / เปอร์เซ็นต์
 * - มีค้นหา, Top N, และเรียงทิศทาง (asc/desc)
 * - รองรับ skeleton/loading, error, และ empty state
 */
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
  /* ─ state ของ control ─ */
  const [metric, setMetric] = React.useState<Metric>(defaultMetric);
  const [sortDir, setSortDir] = React.useState<SortDir>(defaultSortDir);
  const [topN, setTopN] = React.useState<TopN>(defaultTopN);
  const [query, setQuery] = React.useState("");

  /* ─ ดึงข้อมูลที่ใช้โชว์จริง (rows) + ยอดรวมสำหรับ footer (total) ─
   * - ปกป้อง series ให้เป็น array เสมอ
   * - grandTotal = รวม expense ทั้งชุด (ใช้คำนวณ percent)
   * - มี filter ด้วย query (ค้นหาชื่อ category แบบ case-insensitive)
   * - ถ้าค้นหาแล้วไม่เจออะไร → แสดง “อื่น ๆ” (กลุ่มหมวดที่ <= 10% ของยอดรวม)
   * - คำนวณ field ช่วย: amount (expense ปรับเป็น >=0), percent (จาก grandTotal)
   * - จำกัดจำนวนด้วย Top N
   * - total (footer) จะขึ้นอยู่กับ metric ปัจจุบัน
   */
  const { rows, total } = React.useMemo(() => {
    const safe = Array.isArray(series) ? series : [];
    const grandTotal = safe.reduce(
      (acc, r) => acc + Math.max(0, r.expense || 0),
      0
    );

    // ค้นหาจาก query
    const filtered = query.trim()
      ? safe.filter((r) =>
          r.category.toLowerCase().includes(query.trim().toLowerCase())
        )
      : safe;

    // กรณีค้นหาแล้วไม่เจอ → รวมกลุ่ม "อื่น ๆ" (ที่มีสัดส่วน <= 10% ของยอดรวม)
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

    // เติม percent + amount (normalize) ให้ทุกแถว
    const withPercent = filtered.map((r) => ({
      category: r.category,
      amount: Math.max(0, r.expense || 0),
      percent: grandTotal > 0 ? ((r.expense || 0) * 100) / grandTotal : 0,
    }));

    // 🔥 NEW: sort ตาม metric ปัจจุบัน + ทิศทาง sortDir
    const sorted = [...withPercent].sort((a, b) => {
      const av = metric === "percent" ? a.percent : a.amount;
      const bv = metric === "percent" ? b.percent : b.amount;
      if (av === bv) {
        // ผูกลำดับเท่ากันด้วยชื่อหมวด (ให้ผลลัพธ์นิ่งขึ้น)
        return a.category.localeCompare(b.category, "th");
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });

    // จำกัดจำนวนด้วย Top N
    const limited = sorted.slice(0, Number(topN));

    // คำนวณ total สำหรับสรุปท้ายกราฟ (ขึ้นกับ metric)
    const visibleTotal =
      metric === "percent"
        ? limited.reduce((acc, r) => acc + r.percent, 0)
        : limited.reduce((acc, r) => acc + r.amount, 0);

    return { rows: limited, total: visibleTotal };
  }, [series, query, sortDir, topN, metric]);

  /* ─ layout sizing: ให้กราฟสูงพออ่านง่าย ─
   * - baseMin = ความสูงขั้นต่ำของ component
   * - rowHeight = สูงต่อแถว (มีผลกับแท่งและ spacing)
   * - controlsH = เผื่อพื้นที่ส่วน control ด้านบน
   */
  const rowHeight = 36;
  const controlsH = 64;
  const baseMin = 300;
  const height = Math.max(
    baseMin,
    controlsH + rowHeight * Math.max(rows.length, 4)
  );

  // ปรับความหนาสูงสุดของแท่งตามจำนวนแถว (ให้ดู “อิ่ม” พอดีสายตา)
  const maxBarSize = rows.length <= 5 ? 30 : rows.length <= 10 ? 26 : 22;

  /* ─ Guard UI: loading / error / empty ─ */
  if (loading) return <Skeleton className="w-full" style={{ height }} />;
  if (error)
    return (
      <div className="text-sm text-destructive">
        ไม่สามารถโหลดข้อมูลหมวดหมู่ได้
      </div>
    );
  if (!rows.length)
    return <div className="text-sm text-muted-foreground">{emptyHint}</div>;

  // ประเมินความกว้างแกน Y จากชื่อหมวด (ป้องกันข้อความโดนตัด)
  const yAxisWidth = estimateYAxisWidth(rows.map((r) => r.category));

  return (
    <div className="flex w-full flex-col overflow-hidden" style={{ height }}>
      {/* ───────── Controls (metric / sortDir / topN / search) ───────── */}
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* โหมดแสดงผล: จำนวนเงิน / เปอร์เซ็นต์ */}
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

          {/* ตัวเลือกเรียงตาม (ปิดไว้ชั่วคราว—รองรับในอนาคต)
          <Select value={sortKey} onValueChange={(v: SortKey) => setSortKey(v)}>
            <SelectTrigger className="h-8 w-[160px]" aria-label="เรียงตาม">
              <SelectValue placeholder="เรียงตาม" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              <SelectItem value="amount">เรียงตามจำนวนเงิน</SelectItem>
              <SelectItem value="percent">เรียงตามเปอร์เซ็นต์</SelectItem>
            </SelectContent>
          </Select>
          */}

          {/* ทิศทางการเรียง (ไอคอนช่วยสื่อ: มาก→น้อย / น้อย→มาก) */}
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

          {/* Top N (จำนวนแถวสูงสุดที่จะโชว์) */}
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

        {/* ช่องค้นหา: เคสยาว—รองรับหมวดชื่อยาวได้ดี */}
        <div className="min-w-[200px] sm:w-[260px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาหมวด เช่น อาหาร/ค่าจ้าง…"
            className="h-8"
          />
        </div>
      </div>

      {/* ───────── Chart ───────── */}
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical" // แท่งแนวนอน (อ่าน category ง่ายกว่า)
            barGap={6} // ระยะห่างระหว่างแท่ง
            barCategoryGap={8} // ระยะห่างระหว่างหมวด
            margin={{ top: 16, right: 16, bottom: 16, left: 8 }}
          >
            {/* เติม gradient สำหรับสีแท่ง (ผสาน theme chart-2) */}
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

            {/* เส้นกริด: แนวนอนเท่านั้น เพื่อไม่ให้รกตา */}
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />

            {/* แกน X = ค่าตัวเลข (จำนวนเงิน/เปอร์เซ็นต์) */}
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

            {/* แกน Y = ชื่อหมวด (ทั้งหมดแสดงทุกบรรทัด) */}
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

            {/* Tooltip และเส้นไฮไลต์ cursor แบบ dashed ให้ซอฟท์ตา */}
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: 4 }}
              content={
                <CustomTooltip
                  valueFormatter={metric === "percent" ? vfPercent : vfCurrency}
                />
              }
            />

            {/* Legend แบบ custom payload เพื่อให้ label สอดคล้อง metric */}
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

            {/* แท่งข้อมูล: เปลี่ยน dataKey ตาม metric, ใช้ gradient เดียวกัน */}
            <Bar
              dataKey={metric === "percent" ? "percent" : "amount"}
              name={metric === "percent" ? "สัดส่วน (%)" : "จำนวนเงิน"}
              fill="url(#cat-expense)"
              stroke="hsl(var(--chart-2))"
              radius={[6, 6, 6, 6]}
              maxBarSize={maxBarSize}
              isAnimationActive
            >
              {/* ป้ายค่าที่ปลายแท่ง (ขวา) → สั้น กระชับ อ่านง่าย */}
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

      {/* ───────── Summary Footer ─────────
          - แสดงยอดรวมของ “ที่แสดงอยู่” (หลัง Top N + filter)
          - ปรับข้อความตาม metric ที่เลือกอยู่
        */}
      <div className="mt-2 text-right text-xs text-muted-foreground">
        {metric === "percent"
          ? `สัดส่วนรวมของที่แสดง: ${total.toFixed(1)}%`
          : `รวมรายจ่ายที่แสดง: ${formatShort(total)} บาท`}
      </div>
    </div>
  );
}
