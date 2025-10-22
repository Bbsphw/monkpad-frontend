// src/app/(protected)/dashboard/_hooks/use-dashboard.ts

"use client";

import useSWR from "swr";
import * as React from "react";
import { fetchJSONClient } from "@/lib/http-client";
import type {
  SummaryPayload,
  CategoryRow,
  TrafficPoint,
  TrafficAreaPoint,
  RecentRow,
} from "../_types/dashboard";
import {
  buildSummary,
  buildMonthlyTraffic,
  toAreaSeries,
  buildRecent,
  buildCategorySeries,
  countMonthlyTx,
  type TxDTO,
} from "../_services/dashboard-service";

/* ──────────────────────────────────────────────────────────────
 * Response shape จาก API `/api/dashboard/categories`
 * - รองรับทั้ง payload แบบใหม่ (object) และแบบเก่า (array legacy)
 * - ใช้ Type Guards เพื่อ “ไม่ต้องพึ่ง any”
 * ────────────────────────────────────────────────────────────── */

type DashboardDataObject = {
  transactions?: TxDTO[];
  categories?: CategoryRow[];
  legacy?: CategoryRow[];
};

type DashboardAPIResponse =
  | { ok?: boolean; data?: DashboardDataObject }
  | DashboardDataObject
  | CategoryRow[];

/* Type Guards: ระบุรูปแบบ payload โดยไม่ใช้ any */
function hasDataKey(x: unknown): x is { data?: unknown } {
  return (
    !!x && typeof x === "object" && "data" in (x as Record<string, unknown>)
  );
}
function isDashboardDataObject(x: unknown): x is DashboardDataObject {
  return !!x && typeof x === "object";
}

/* ───────────────────────────── fetcher ─────────────────────────────
 * ✅ ไม่มีตัวแปรไม่ได้ใช้: ตัด key ออกจาก tuple ด้วย [, ...]
 * ✅ ไม่มี any: ใช้ type guard + Array.isArray
 * ดึงข้อมูล dashboard แล้ว derive โครงสร้างพร้อมใช้ในครั้งเดียว
 */
async function fetchDashboardBundle([, year, month, type]: [
  string,
  number,
  number,
  "income" | "expense"
]) {
  const res = await fetchJSONClient<DashboardAPIResponse>(
    `/api/dashboard/categories?` +
      new URLSearchParams({
        year: String(year),
        month: String(month),
        type,
      }).toString()
  );

  // รองรับทั้งกรณี { ok, data } และ object/array ตรง ๆ
  const raw: unknown = hasDataKey(res) ? res.data : res;

  // txs (ถ้ามี)
  const txs: TxDTO[] =
    isDashboardDataObject(raw) && Array.isArray(raw.transactions)
      ? raw.transactions
      : [];

  /* ── มีธุรกรรม → คิดสรุปเต็ม ───────────────────── */
  if (txs.length > 0) {
    return {
      summary: buildSummary(txs, year, month),
      categories: buildCategorySeries(txs, year, month, type),
      trafficMonthly: buildMonthlyTraffic(txs, year),
      trafficArea: toAreaSeries(buildMonthlyTraffic(txs, year), year),
      recent: buildRecent(txs),
      txCount: countMonthlyTx(txs, year, month),
    };
  }

  /* ── ไม่มีธุรกรรม → ดึงหมวด (รองรับทั้ง categories / legacy / array) ── */
  const categories: CategoryRow[] = (() => {
    if (Array.isArray(raw)) return raw; // legacy array ล้วน
    if (isDashboardDataObject(raw)) {
      if (Array.isArray(raw.categories)) return raw.categories;
      if (Array.isArray(raw.legacy)) return raw.legacy;
    }
    return [];
  })();

  const totalExpense = categories.reduce((sum, c) => sum + (c.expense ?? 0), 0);

  const summary: SummaryPayload = {
    year,
    month,
    income: 0,
    expense: totalExpense,
    balance: -totalExpense,
  };

  return {
    summary,
    categories,
    trafficMonthly: [] as TrafficPoint[],
    trafficArea: [] as TrafficAreaPoint[],
    recent: [] as RecentRow[],
    txCount: 0,
  };
}

/* ───────────────────────────── Hook หลัก ───────────────────────────── */
export function useDashboard() {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  const [type, setType] = React.useState<"income" | "expense" | "all">("all");

  // วิเคราะห์ฝั่งกราฟใช้ expense เป็นค่าเริ่มต้น (สเปกปัจจุบัน)
  const queryType: "income" | "expense" = "expense";

  // Key สำหรับ SWR (ตัด key ตัวแรกทิ้งตอน fetcher เพื่อเลี่ยง unused var)
  const swrKey: [string, number, number, "income" | "expense"] = [
    "dashboard-bundle",
    year,
    month,
    queryType,
  ];

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetchDashboardBundle,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    }
  );

  return {
    year,
    month,
    type,
    setYear,
    setMonth,
    setType,

    summary: data?.summary ?? null,
    categories: data?.categories ?? null,
    traffic: data?.trafficMonthly ?? null,
    trafficArea: data?.trafficArea ?? null,
    recent: data?.recent ?? null,
    txCount: data?.txCount ?? 0,

    loading: isLoading,
    error: error instanceof Error ? error.message : null,

    reload: () => mutate(),
  };
}
