// src/app/(protected)/dashboard/_services/dashboard-service.ts

import { fetchJSONClient } from "@/lib/http-client";
import type {
  SummaryPayload,
  TrafficPoint,
  TrafficAreaPoint,
  RecentRow,
  CategoryRow,
} from "../_types/dashboard";

/**
 * TxDTO:
 * รูปร่างธุรกรรมดิบที่ได้จาก backend (API aggregation)
 * - บางฟิลด์ซ้ำซ้อน (value | amount, tag | category) → ฝั่ง derive จะ normalize เอง
 * - date: ISO string (สมมติ backend validate แล้ว)
 */
export type TxDTO = {
  id: number | string;
  tag_id?: number;
  value?: number; // บาง API ส่ง value
  amount?: number; // บาง API ส่ง amount
  date: string; // YYYY-MM-DD (หรือ ISO date ที่ parse ได้)
  time?: string; // HH:MM (optional)
  type: "income" | "expense";
  tag?: string; // เลเบลหมวดหมู่จากระบบ tag
  category?: string; // ชื่อหมวดหมู่กรณี legacy/back-compat
  note?: string;
};

/**
 * รูปแบบ response ที่ route /api/dashboard/categories อาจส่งกลับมา
 * - บางเวอร์ชันส่ง {transactions: TxDTO[], categories: CategoryRow[]}
 * - บางเวอร์ชันส่งเฉพาะ CategoryRow[] (legacy)
 * - จึงต้องเขียน type ให้รองรับได้กว้าง (any fallback)
 */
type CategoriesAPIResponse =
  | {
      ok: true;
      data: {
        transactions?: TxDTO[];
        categories?: CategoryRow[];
        legacy?: CategoryRow[]; // รองรับเคสเก่า
      };
    }
  | { ok: true; data: CategoryRow[] }
  | any;

/* ───────────────────────────── Utilities ───────────────────────────── */

/** ตรวจว่า date ISO อยู่เดือน/ปีเดียวกันหรือไม่ (ใช้กรุ๊ป per-month) */
const sameMonth = (dISO: string, y: number, m: number) => {
  const d = new Date(dISO);
  return d.getFullYear() === y && d.getMonth() + 1 === m;
};

/** แปลง unknown → number แบบปลอดภัย (NaN → 0) */
const asAmount = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/* ───────────────────────────── Derive Functions ─────────────────────────────
 * ฟังก์ชันด้านล่าง “คำนวณ/สรุปผล” จากรายการธุรกรรมดิบ (TxDTO[])
 * ข้อดี:
 *  - เลเยอร์ derive แยกจาก fetcher → ทดสอบง่าย/แคชง่าย/เปลี่ยนกติกาธุรกิจง่าย
 *  - ทุกตัว pure function → deterministic / ไม่มี side-effect
 *  - รองรับค่า value/amount และ tag/category ที่อาจมากับ API แตกต่างกัน
 *  - ระวังคีย์เวลา: amount เป็น “จำนวนบวก” เสมอ, sign แยกที่ type
 */

/** สรุปยอดรายรับ/รายจ่าย/คงเหลือ ในเดือน/ปีที่ระบุ */
export function buildSummary(txs: TxDTO[], y: number, m: number) {
  let income = 0,
    expense = 0;
  for (const t of txs) {
    if (!sameMonth(t.date, y, m)) continue;
    const v = asAmount(t.value ?? t.amount);
    if (t.type === "income") income += v;
    else expense += v;
  }
  return { year: y, month: m, income, expense, balance: income - expense };
}

/**
 * สร้าง series รายเดือนทั้งปี (12 จุด) → ใช้กับกราฟ “รายเดือน”
 * - month: MM/YY (เช่น "01/25")
 * - income/expense: sum ของเดือนนั้น
 * หมายเหตุ: ไม่ normalize day → ใช้ month index จาก Date.getMonth()
 */
export function buildMonthlyTraffic(txs: TxDTO[], y: number) {
  const buckets = Array.from({ length: 12 }, (_, i) => ({
    month: `${String(i + 1).padStart(2, "0")}/${String(y).slice(-2)}`,
    income: 0,
    expense: 0,
  }));
  for (const t of txs) {
    const d = new Date(t.date);
    if (d.getFullYear() !== y) continue;
    const idx = d.getMonth();
    const v = asAmount(t.value ?? t.amount);
    if (t.type === "income") buckets[idx].income += v;
    else buckets[idx].expense += v;
  }
  return buckets;
}

/**
 * แปลง TrafficPoint (month: MM/YY) → TrafficAreaPoint (date: YYYY-MM-01)
 * เพื่อให้กราฟ AreaChart ใช้แกน X เป็นวันที่แบบ ISO-friendly สม่ำเสมอ
 */
export const toAreaSeries = (tp: TrafficPoint[], y: number) =>
  tp.map((p) => {
    const [mm] = p.month.split("/");
    return {
      date: `${y}-${String(mm).padStart(2, "0")}-01`,
      income: p.income,
      expense: p.expense,
    };
  });

/**
 * จัด “รายการล่าสุด” (เรียงใหม่ล่าสุดก่อน) และ normalize ฟิลด์โชว์ในตาราง
 * - category: ใช้ t.tag ก่อน ถ้าไม่มี fallback ที่ t.category
 * - amount : asAmount(value ?? amount)
 * - time    optional → ฝั่ง UI แสดงถ้ามี
 */
export function buildRecent(txs: TxDTO[]) {
  const sorted = [...txs].sort((a, b) =>
    `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`)
  );
  return sorted.map((t) => ({
    id: String(t.id),
    date: t.date,
    time: t.time,
    type: t.type,
    category: t.tag ?? t.category ?? "-",
    amount: asAmount(t.value ?? t.amount),
    note: t.note ?? "",
  }));
}

/**
 * สร้าง series ของโดนัทหมวดหมู่ (ใช้กับรายรับหรือรายจ่าย)
 * - กรองเฉพาะเดือน/ปีที่ระบุ และ type ที่สนใจ (default = expense)
 * - aggregate ด้วย Map เพื่อความเร็ว O(n)
 * - คืนค่าเป็น array ที่เรียงจาก “ยอดมาก → น้อย”
 */
export function buildCategorySeries(
  txs: TxDTO[],
  y: number,
  m: number,
  type: "income" | "expense" = "expense"
) {
  const agg = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    if (!sameMonth(t.date, y, m)) continue;
    const key = t.tag ?? t.category ?? "อื่น ๆ"; // fallback ป้องกัน empty label
    agg.set(key, (agg.get(key) ?? 0) + asAmount(t.value ?? t.amount));
  }
  return [...agg.entries()]
    .map(([category, expense]) => ({ category, expense }))
    .sort((a, b) => b.expense - a.expense);
}

/** นับจำนวนธุรกรรมในเดือน/ปีที่ระบุ (ใช้แสดง Stat “txCount”) */
export function countMonthlyTx(txs: TxDTO[], y: number, m: number) {
  return txs.filter((t) => sameMonth(t.date, y, m)).length;
}

/* ───────────────────────────── API Orchestrator ─────────────────────────────
 * getDashboardAll:
 * - ดึงข้อมูลรวมจาก route เดียว แล้ว “derive ทุกอย่าง” ในครั้งเดียว
 * - ข้อดี: ลดจำนวน request และให้หน้าจอทุกจุด sync จาก source เดียวกัน
 * - Fallback: กรณี backend ยังไม่ส่ง transactions → ใช้ categories Raw (legacy)
 */
export async function getDashboardAll(params: {
  year: number;
  month: number;
  categoryType?: "income" | "expense"; // หมวดที่ใช้วาดโดนัท
}) {
  const { year, month, categoryType = "expense" } = params;

  // 1) เรียก API เดียว ที่รวมข้อมูลจำเป็น
  const res = await fetchJSONClient<CategoriesAPIResponse>(
    "/api/dashboard/categories?" +
      new URLSearchParams({
        year: String(year),
        month: String(month),
        type: categoryType,
      }).toString()
  );

  // 2) ปรับ payload ให้เป็นรูปแบบเดียว (รองรับ data wrapper หรือไม่ก็ได้)
  const payload = (res as any)?.data ?? res;

  // transactions อาจไม่มี (กรณี fallback เดิม)
  const txs: TxDTO[] = Array.isArray(payload?.transactions)
    ? payload.transactions
    : [];

  // categoriesRaw ใช้เฉพาะ fallback
  const categoriesRaw: CategoryRow[] = Array.isArray(payload?.categories)
    ? payload.categories
    : Array.isArray(payload?.legacy)
    ? payload.legacy
    : Array.isArray(payload)
    ? payload
    : [];

  // 3) กรณีมี transactions → derive ทุกอย่างจาก txs (แหล่งความจริงตัวเดียว)
  if (txs.length > 0) {
    const summary = buildSummary(txs, year, month);
    const trafficMonthly = buildMonthlyTraffic(txs, year);
    const trafficArea = toAreaSeries(trafficMonthly, year);
    const recent = buildRecent(txs);
    const categories = buildCategorySeries(txs, year, month, categoryType);
    const txCount = countMonthlyTx(txs, year, month);

    return {
      summary,
      categories,
      trafficMonthly,
      trafficArea,
      recent,
      txCount,
    };
  }

  // 4) Fallback: ไม่มี txs → ใช้ categoriesRaw เป็นหลัก (รองรับระบบเดิม)
  const categories = categoriesRaw;
  const totalExpense = categories.reduce((s, c) => s + (c.expense || 0), 0);

  // หมายเหตุ: ที่นี่ไม่รู้ยอด income จาก fallback → กำหนด income = 0
  const summary: SummaryPayload = {
    year,
    month,
    income: 0,
    expense: totalExpense,
    balance: -totalExpense,
  };

  const txCount = 0; // ไม่มีข้อมูล tx → ตั้ง 0

  return {
    summary,
    categories,
    trafficMonthly: [] as TrafficPoint[], // ไม่มีข้อมูล series
    trafficArea: [] as TrafficAreaPoint[], // ไม่มีข้อมูล series
    recent: [] as RecentRow[], // ไม่มีข้อมูลตาราง
    txCount,
  };
}
