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
import type { z } from "zod"; // ✅ ใช้ z.infer เพื่อดึงชนิดจาก Zod schema (เลี่ยง any)

/* ──────────────────────────────────────────────
 * 🔹 Helper Functions
 *   กลุ่มฟังก์ชัน pure (ไม่มี side-effect)
 *   สำหรับการจัดกลุ่ม, สรุปผล, และ validate ข้อมูล
 *   ใช้ร่วมกับทั้ง useReports และ service อื่นในโมดูลนี้
 * ────────────────────────────────────────────── */

/** แปลงวันที่เป็น key รูปแบบ MM/YY → ใช้สำหรับ grouping รายเดือน */
function mmYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

/** ปลอดภัยจาก NaN → ถ้าแปลงไม่ได้จะคืนค่า 0 */
function safeNum(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/** บีบค่าเดือนให้อยู่ในช่วง 1–12 (กัน error จาก input ที่หลุดขอบ) */
function clampMonth(m: number) {
  return Math.max(1, Math.min(12, Math.floor(m)));
}

/**
 * รวมธุรกรรมทั้งหมดเป็น “รายเดือน”
 * ──────────────────────────────
 * 1️⃣ Group ตาม MM/YY
 * 2️⃣ แยก income / expense
 * 3️⃣ เรียงตามเวลาเก่า→ใหม่ (ใช้ order = YYYYMM)
 * 4️⃣ คืน array ที่พร้อมใช้กับกราฟ ColumnBarChart
 */
function buildMonthlySeries(transactions: Transaction[]): MonthlyPoint[] {
  const map = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue; // skip data เสีย

    const key = mmYY(d);
    const bucket = map.get(key) ?? { income: 0, expense: 0 };

    if (t.type === "income") bucket.income += safeNum(t.value);
    else bucket.expense += safeNum(t.value);

    map.set(key, bucket);
  }

  // sort โดยอิงปี/เดือน เพื่อให้กราฟไม่สลับลำดับ
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

/**
 * รวมยอด “รายหมวดหมู่” สำหรับเดือน/ปี/ประเภทที่เลือก
 * ──────────────────────────────
 * ใช้แสดงใน BarTrendChart
 * - filter ตามเดือน/ปี + type
 * - รวมยอดด้วย Map (O(n))
 * - แปลงเป็น array พร้อม sort จากมาก → น้อย
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
    .sort((a, b) => b.expense - a.expense);
}

/**
 * สรุปยอดรวมทั้งระบบ (ไม่จำกัดเดือน)
 * ──────────────────────────────
 * ใช้สำหรับ ReportCards
 *  - รวม income / expense
 *  - balance = income - expense
 *  - transactions = จำนวนธุรกรรมทั้งหมด
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

/* ──────────────────────────────────────────────
 * 🔹 Public Service: getReports()
 *  Endpoint หลักสำหรับดึงข้อมูลสรุปของ Reports ทั้งหน้า
 * ──────────────────────────────────────────────
 * Pipeline:
 *   1️⃣ validate params ด้วย zod (ReportQuerySchema)
 *   2️⃣ fetch จาก /api/reports/categories
 *   3️⃣ validate response ด้วย ApiPayloadSchema
 *   4️⃣ derive ข้อมูลออกมาเป็น:
 *        - summary (สรุปยอดรวม)
 *        - monthlySeries (แนวโน้มรายเดือน)
 *        - categorySeries (หมวดรายจ่ายเดือนที่เลือก)
 * ────────────────────────────────────────────── */

// ✅ อ้างชนิดผลลัพธ์จาก schema โดยตรง (เลี่ยง any)
type ApiPayload = z.infer<typeof ApiPayloadSchema>;

export async function getReports(params: {
  year: number;
  month: number;
  type: TxType | "all";
}): Promise<ReportData> {
  // ✅ ตรวจสอบ input ฝั่ง client (เช่นปี/เดือนผิด)
  const parsed = ReportQuerySchema.parse(params);

  // API รองรับแค่ income | expense → ถ้า "all" จะ fallback เป็น "expense"
  const q = new URLSearchParams({
    year: String(parsed.year),
    month: String(clampMonth(parsed.month)),
    type: parsed.type === "all" ? "expense" : parsed.type,
  });

  // ✅ fetch ผ่าน wrapper: ระบุชนิดเป็น ApiPayload (ไม่ใช้ any)
  const res = await fetchJSONClient<ApiPayload>(`/api/reports/categories?${q}`);

  // ✅ ตรวจ response shape อีกชั้นเพื่อป้องกัน backend mismatch
  const payload = ApiPayloadSchema.parse(res);

  // ── Derive data ──
  const txs: Transaction[] = payload.data.transactions ?? [];
  const summary = buildSummary(txs);
  const monthlySeries = buildMonthlySeries(txs);

  // ✅ category series อิงเดือน/ปีและ type ที่ query มาจริง
  const selectedType = (
    parsed.type === "all" ? "expense" : parsed.type
  ) as TxType;
  const categorySeries = buildCategorySeriesForMonth(
    txs,
    parsed.year,
    parsed.month,
    selectedType
  );

  // ✅ คืนโครงสร้างพร้อมใช้กับหน้า ReportClient
  return { summary, monthlySeries, categorySeries };
}
