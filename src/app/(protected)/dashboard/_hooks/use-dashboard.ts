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

/* ───────────────────────────── fetchDashboardBundle ─────────────────────────────
 * 🔍 ฟังก์ชัน fetcher สำหรับ useSWR
 * ดึงข้อมูลจาก endpoint `/api/dashboard/categories` เพียงครั้งเดียว
 * แล้ว "derive" ข้อมูลทั้งหมดที่แดชบอร์ดต้องใช้ในฝั่ง client:
 * - Summary (รายรับ/รายจ่าย/ยอดคงเหลือ)
 * - Category series (โดนัทกราฟ)
 * - Traffic series (กราฟแนวโน้ม)
 * - Recent transactions
 * - จำนวนธุรกรรมในเดือนนั้น
 *
 * ✅ ออกแบบให้เป็น “bundle fetch” — ประหยัดการยิง API หลายครั้ง
 * ✅ คืนค่าโครงสร้างข้อมูลรวมทั้งหมดในรูปเดียว
 */
async function fetchDashboardBundle([key, year, month, type]: [
  string,
  number,
  number,
  "income" | "expense"
]) {
  // 🔗 เรียก API พร้อม query string ของเดือน/ปี/ประเภท
  const res = await fetchJSONClient<any>(
    `/api/dashboard/categories?` +
      new URLSearchParams({
        year: String(year),
        month: String(month),
        type,
      }).toString()
  );

  // ปรับ payload ให้เป็นโครงสร้างมาตรฐาน
  const payload = (res as any)?.data ?? res;

  // ตรวจว่ามี transactions จริงไหม
  const txs: TxDTO[] = Array.isArray(payload?.transactions)
    ? payload.transactions
    : [];

  /* ── กรณีมี transactions ───────────────────────────── */
  if (txs.length) {
    // สร้าง summary (รายรับ/รายจ่าย/ยอดคงเหลือ)
    const summary: SummaryPayload = buildSummary(txs, year, month);

    // แปลงข้อมูลเป็น series แบบรายเดือน
    const trafficMonthly: TrafficPoint[] = buildMonthlyTraffic(txs, year);

    // แปลง series รายเดือน → area chart data
    const trafficArea: TrafficAreaPoint[] = toAreaSeries(trafficMonthly, year);

    // ดึงรายการล่าสุด (เช่น 10 รายการหลังสุด)
    const recent: RecentRow[] = buildRecent(txs);

    // รวมรายจ่ายแยกตามหมวดหมู่
    const categories: CategoryRow[] = buildCategorySeries(
      txs,
      year,
      month,
      type
    );

    // นับจำนวนธุรกรรมในเดือนนั้น
    const txCount = countMonthlyTx(txs, year, month);

    // ✅ คืนค่า bundle เดียวให้แดชบอร์ดใช้ทั้งหมด
    return {
      summary,
      categories,
      trafficMonthly,
      trafficArea,
      recent,
      txCount,
    };
  }

  /* ── กรณีไม่มี transactions ─────────────────────────────
   * ใช้ fallback เพื่อกัน API บาง version ส่งข้อมูลไม่ครบ
   * เช่น backend ส่งเฉพาะ categories/legacy array
   */
  const categories: CategoryRow[] = Array.isArray(payload?.categories)
    ? payload.categories
    : Array.isArray(payload?.legacy)
    ? payload.legacy
    : Array.isArray(payload)
    ? payload
    : [];

  // สรุปรายจ่ายรวมเพื่อคำนวณ summary แบบ placeholder
  const totalExpense = categories.reduce((s, c) => s + (c.expense || 0), 0);

  const summary: SummaryPayload = {
    year,
    month,
    income: 0,
    expense: totalExpense,
    balance: -totalExpense,
    txCount: 0,
  } as any;

  // ✅ ส่งข้อมูล fallback กลับให้แดชบอร์ดทำงานได้แม้ไม่มีธุรกรรม
  return {
    summary,
    categories,
    trafficMonthly: [] as TrafficPoint[],
    trafficArea: [] as TrafficAreaPoint[],
    recent: [] as RecentRow[],
    txCount: 0,
  };
}

/* ───────────────────────────── useDashboard Hook ─────────────────────────────
 * 🧩 Custom Hook หลักของแดชบอร์ด
 * ทำหน้าที่:
 *  1. จัดการ state (ปี, เดือน, ประเภท)
 *  2. ใช้ SWR ดึงข้อมูลแดชบอร์ดแบบรวม (bundle)
 *  3. แปลงให้อยู่ในรูปพร้อมใช้ใน component เช่น DashboardClient
 *
 * 🎯 จุดเด่น:
 *  - ใช้ SWR เพื่อ cache, dedupe, refresh อัตโนมัติ
 *  - ป้องกัน reload ซ้ำใน React Strict Mode
 *  - ส่งคืนค่าครบทั้ง loading/error/reload function
 */
export function useDashboard() {
  const today = new Date();

  // 🔧 State: ปี / เดือน ปัจจุบัน
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);

  // (optional) เผื่ออนาคตแยก view รายรับ/รายจ่าย/ทั้งหมด
  const [type, setType] = React.useState<"income" | "expense" | "all">("all");

  // 🎯 เราใช้ข้อมูลสัดส่วนรายจ่ายในโดนัท chart เป็นหลัก → ใช้ queryType = "expense"
  const queryType: "income" | "expense" = "expense";

  // 🔑 สร้าง key สำหรับ SWR (ใช้ tuple เพื่อควบคุม cache แยกตามเดือน/ปี/type)
  const swrKey: [string, number, number, "income" | "expense"] = [
    "dashboard-bundle",
    year,
    month,
    queryType,
  ];

  // 🚀 เรียก useSWR เพื่อจัดการ fetch/cache/revalidate
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetchDashboardBundle,
    {
      dedupingInterval: 5000, // ป้องกันยิงซ้ำใน dev/StrictMode ภายใน 5s
      revalidateOnFocus: false, // ไม่ต้อง refresh เมื่อสลับ tab
      revalidateOnReconnect: false, // ไม่ต้อง refetch เมื่อ network กลับมา
      keepPreviousData: true, // UX ลื่น ไม่ flash loading เมื่อเปลี่ยนเดือน
    }
  );

  /* 🧩 คืนค่าออกไปให้ component แดชบอร์ด */
  return {
    year,
    month,
    type,
    setYear,
    setMonth,
    setType,

    // ✅ ข้อมูลหลัก
    summary: data?.summary ?? null,
    categories: data?.categories ?? null,
    traffic: data?.trafficMonthly ?? null,
    trafficArea: data?.trafficArea ?? null,
    recent: data?.recent ?? null,
    txCount: data?.txCount ?? 0,

    // ✅ สถานะโหลดและ error
    loading: isLoading,
    error: error ? (error as Error).message : null,

    // ✅ ใช้ refresh dashboard manual (เช่นปุ่ม "รีเฟรช")
    reload: () => mutate(),
  };
}
