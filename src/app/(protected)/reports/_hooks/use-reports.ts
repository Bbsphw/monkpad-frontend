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

/* ────────────────────────────────────────────────────────────────
 * helpers (เดิมของ service)
 *  - ฟังก์ชันเล็ก ๆ ที่ใช้รวม/แปลงข้อมูลบนฝั่ง client
 *  - ไม่มี side-effect → ปลอดภัยต่อการ reuse/ทดสอบ
 * ──────────────────────────────────────────────────────────────── */

/** คืนสตริง MM/YY จากวันที่ เพื่อใช้เป็น key ของ bucket รายเดือน */
function mmYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

/** แปลงค่าอะไรก็ได้ให้เป็น number แบบปลอดภัย (NaN → 0) */
const safeNum = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/**
 * รวมธุรกรรมทั้งหมดให้เป็น series รายเดือนสำหรับกราฟ column
 * - กลุ่มตาม mm/yy
 * - แยก income/expense
 * - คงลำดับเวลาจากเก่ามาหาใหม่
 */
function buildMonthlySeries(transactions: Transaction[]): MonthlyPoint[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue; // กันข้อมูลเสีย
    const key = mmYY(d);
    const bucket = map.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += safeNum(t.value);
    else bucket.expense += safeNum(t.value);
    map.set(key, bucket);
  }
  // ยกข้อมูลจาก Map → array และใส่ order เพื่อ sort ตามเวลาอย่างแม่นยำ
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

/**
 * สร้างสรุปหมวดหมู่เฉพาะ “เดือน/ปี” ที่ระบุ
 * - API ฝั่งเราอยากได้ series ของ "expense" เป็นหลัก
 * - แต่รองรับ income ด้วย (เผื่อมีการสลับ type)
 * - รวมยอดด้วย Map เพื่อให้ O(n)
 */
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
    .sort((a, b) => b.expense - a.expense); // เรียงมาก→น้อย เพื่อเอาไปทำ Top N ต่อได้ง่าย
}

/**
 * สรุปยอดรวมทั้งก้อน (ไม่จำกัดเดือน)
 * - ใช้ในการ์ดสรุป: income, expense, balance, transactions
 * - ตัดปัญหา NaN ด้วย safeNum
 */
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

/* ────────────────────────────────────────────────────────────────
 * SWR fetcher: ดึง route เดียวแล้ว derive ทุกอย่าง “ครั้งเดียว”
 * - Key รูปแบบ: [string, number, number, "all" | TxType]
 * - Validate พารามิเตอร์ด้วย zod (ReportQuerySchema)
 * - Validate payload/shape จาก API ด้วย zod (ApiPayloadSchema)
 *   → ทำให้ส่วนที่เหลือของ UI มั่นใจใน type ได้จริง
 * ──────────────────────────────────────────────────────────────── */
async function fetchReportBundle([key, year, month, typeAllOrOne]: [
  string,
  number,
  number,
  "all" | TxType
]) {
  // ✅ ตรวจสอบพารามิเตอร์ขาเข้าอย่างเคร่งครัด (fail fast)
  const parsed = ReportQuerySchema.parse({ year, month, type: typeAllOrOne });

  // API /reports/categories ต้องการเพียง income|expense
  // แต่ฝั่ง UI อาจเลือก "all" → ให้แมปเป็น "expense" เป็นค่า default (ตามสเปคเดิม)
  const apiType: TxType = parsed.type === "all" ? "expense" : parsed.type;

  // ประกอบ query string แบบชัดเจน (stringify ล่วงหน้า)
  const q = new URLSearchParams({
    year: String(parsed.year),
    month: String(parsed.month),
    type: apiType,
  }).toString();

  // ❗ ใช้ fetchJSONClient (ห่อ fetch): รวม header/token/throw error ไว้ที่เดียว
  const res = await fetchJSONClient<any>(`/api/reports/categories?${q}`);

  // ✅ ตรวจ payload ด้วย zod อีกชั้น (กัน backend เปลี่ยน shape โดยไม่ตั้งใจ)
  const payload = ApiPayloadSchema.parse(res);

  // ── Derive ข้อมูลทั้งหมดบน client เพียงครั้งเดียว ──
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

/* ────────────────────────────────────────────────────────────────
 * public hook: useReports
 * - รับพารามิเตอร์ year/month/type จากผู้ใช้
 * - ปกป้องตัวเองด้วย safeParse → ถ้าค่าไม่ valid ใช้วันนี้เป็น default
 * - สร้าง SWR key ให้มีเสถียรภาพ (tuple) เพื่อ de-dupe ได้ดี
 * - ปิด revalidate-on-focus เพื่อควบคุมการโหลดเอง
 * - เปิด keepPreviousData เพื่อ UX ลื่น (กราฟไม่วูบ)
 * - expose: data/loading/error/reload สำหรับ UI layer
 * ──────────────────────────────────────────────────────────────── */
export function useReports(params: {
  year: number;
  month: number;
  type: "income" | "expense" | "all";
}) {
  // ป้องกัน edge case: พารามิเตอร์เสีย → fallback เป็นปี/เดือนปัจจุบัน
  const valid = ReportQuerySchema.pick({ year: true, month: true }).safeParse(
    params
  );
  const y = valid.success ? valid.data.year : new Date().getFullYear();
  const m = valid.success ? valid.data.month : new Date().getMonth() + 1;
  const t = params.type ?? "all";

  // Key แบบ tuple → SWR จะ compare แบบ shallow และ de-dupe ได้ดี
  const key: [string, number, number, "all" | TxType] = [
    "reports-bundle",
    y,
    m,
    t,
  ];

  const { data, error, isLoading, mutate } = useSWR(key, fetchReportBundle, {
    // Dev UX: กันยิงซ้ำใน StrictMode + ไม่รีเฟรชตอนสลับแท็บ
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    // UX ลื่น: แสดงข้อมูลเก่าจนกว่าของใหม่จะพร้อม → กราฟไม่วูบลง
    keepPreviousData: true,
  });

  return {
    data, // พร้อมใช้งานใน ReportClient
    loading: isLoading, // ใช้แสดง skeleton
    error: error ? (error as Error).message : null, // แปลงเป็นข้อความปลอดภัย
    reload: () => mutate(), // ให้หน้าเรียกรีโหลดเองได้ (เช่นหลังแก้/ลบข้อมูล)
  };
}
