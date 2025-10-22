// src/app/(protected)/reports/_hooks/use-reports.ts

"use client";

import useSWR from "swr";
import { fetchJSONClient } from "@/lib/http-client";
import type {
  ReportData,
  TxType,
  Transaction,
  CategoryRow,
  MonthlyPoint,
} from "../_types/reports";
import {
  ReportQuerySchema,
  ApiPayloadSchema,
} from "../_schemas/reports-schema";

/* ---------- helpers (เดิมของ service) ---------- */
function mmYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}
const safeNum = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

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
  return [...map.entries()]
    .map(([k, v]) => {
      const [mm, yy] = k.split("/");
      const year = Number(`20${yy}`);
      const month = Number(mm);
      return { key: k, order: year * 100 + month, ...v };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ key, income, expense }) => ({ month: key, income, expense }));
}

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

/* ---------- SWR fetcher: ดึงครั้งเดียวและ derive ---------- */
async function fetchReportBundle([key, year, month, typeAllOrOne]: [
  string,
  number,
  number,
  "all" | TxType
]) {
  const parsed = ReportQuerySchema.parse({ year, month, type: typeAllOrOne });
  const apiType: TxType = parsed.type === "all" ? "expense" : parsed.type; // API ต้องการ income|expense

  const q = new URLSearchParams({
    year: String(parsed.year),
    month: String(parsed.month),
    type: apiType,
  }).toString();

  const res = await fetchJSONClient<any>(`/api/reports/categories?${q}`);
  const payload = ApiPayloadSchema.parse(res);

  const txs: Transaction[] = payload.data.transactions ?? [];
  const summary = buildSummary(txs);
  const monthlySeries = buildMonthlySeries(txs);
  const categorySeries = buildCategorySeriesForMonth(
    txs,
    parsed.year,
    parsed.month,
    apiType
  );

  const data: ReportData = { summary, monthlySeries, categorySeries };
  return data;
}

/* ---------- public hook ---------- */
export function useReports(params: {
  year: number;
  month: number;
  type: "income" | "expense" | "all";
}) {
  const valid = ReportQuerySchema.pick({ year: true, month: true }).safeParse(
    params
  );
  const y = valid.success ? valid.data.year : new Date().getFullYear();
  const m = valid.success ? valid.data.month : new Date().getMonth() + 1;
  const t = params.type ?? "all";

  const key: [string, number, number, "all" | TxType] = [
    "reports-bundle",
    y,
    m,
    t,
  ];

  const { data, error, isLoading, mutate } = useSWR(key, fetchReportBundle, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
  });

  return {
    data,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    reload: () => mutate(),
  };
}
