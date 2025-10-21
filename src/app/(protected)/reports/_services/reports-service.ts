// src/app/(protected)/reports/_services/report-service.ts

import {
  ReportQuerySchema,
  ApiPayloadSchema,
} from "../_schemas/reports-schema";
import type {
  ReportData,
  Transaction,
  CategoryRow,
  MonthlyPoint,
  TxType,
} from "../_types/reports";
import { fetchJSONClient } from "@/lib/http-client";

/* ───────────── helpers ───────────── */

function mmYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

function safeNum(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function clampMonth(m: number) {
  return Math.max(1, Math.min(12, Math.floor(m)));
}

/** รวมยอดตามเดือนจาก transactions ทั้งหมด */
function buildMonthlySeries(transactions: Transaction[]): MonthlyPoint[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = mmYY(d);
    const bucket = map.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += safeNum(t.value);
    else bucket.expense += safeNum(t.value);
    map.set(key, bucket);
  }
  // sort ตามเดือน (เก่า→ใหม่) โดยแปลงกลับเป็น Date กึ่งๆ เพื่อเทียบ
  const rows: MonthlyPoint[] = [...map.entries()]
    .map(([k, v]) => {
      const [mm, yy] = k.split("/");
      const year = Number(`20${yy}`);
      const month = Number(mm);
      return { key: k, order: year * 100 + month, ...v };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ key, income, expense }) => ({ month: key, income, expense }));
  return rows;
}

/** รวมหมวดเฉพาะเดือน/ปี + type ที่เลือก */
function buildCategorySeriesForMonth(
  transactions: Transaction[],
  year: number,
  month: number,
  type: TxType
): CategoryRow[] {
  const selected = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === type && d.getFullYear() === year && d.getMonth() + 1 === month
    );
  });
  const agg = new Map<string, number>();
  for (const t of selected) {
    const cat = String(t.tag ?? "อื่น ๆ");
    agg.set(cat, (agg.get(cat) ?? 0) + safeNum(t.value));
  }
  return [...agg.entries()]
    .map(([category, expense]) => ({ category, expense }))
    .sort((a, b) => b.expense - a.expense);
}

/** รวมยอด summary จากธุรกรรมทั้งหมด (ไม่บังคับต้องจำกัดเดือน) */
function buildSummary(transactions: Transaction[]): ReportData["summary"] {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + safeNum(t.value), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + safeNum(t.value), 0);
  return {
    income,
    expense,
    balance: income - expense,
    transactions: transactions.length,
  };
}

/* ───────────── public service ───────────── */

/**
 * ดึงครั้งเดียวจาก /api/reports/categories?year&month&type
 * แล้ว derive: summary, monthlySeries, categorySeries (ตามเดือน/ประเภทที่ขอ)
 */
export async function getReports(params: {
  year: number;
  month: number;
  type: TxType | "all";
}): Promise<ReportData> {
  const parsed = ReportQuerySchema.parse(params);
  const q = new URLSearchParams({
    year: String(parsed.year),
    month: String(clampMonth(parsed.month)),
    type: parsed.type === "all" ? "expense" : parsed.type, // API ต้องการ income | expense
  });

  const res = await fetchJSONClient<any>(`/api/reports/categories?${q}`);
  const payload = ApiPayloadSchema.parse(res);

  const txs: Transaction[] = payload.data.transactions ?? [];
  const summary = buildSummary(txs);
  const monthlySeries = buildMonthlySeries(txs);

  // category: อิงเดือน/ปี และชนิดจาก query ที่ส่งไป
  const selectedType = (
    parsed.type === "all" ? "expense" : parsed.type
  ) as TxType;
  const categorySeries = buildCategorySeriesForMonth(
    txs,
    parsed.year,
    parsed.month,
    selectedType
  );

  return { summary, monthlySeries, categorySeries };
}
