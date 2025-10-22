// src/app/(protected)/dashboard/_services/dashboard-service.ts

import { fetchJSONClient } from "@/lib/http-client";
import type {
  SummaryPayload,
  TrafficPoint,
  TrafficAreaPoint,
  RecentRow,
  CategoryRow,
} from "../_types/dashboard";

/* ───────────────────────────── DTO & API Response ───────────────────────────── */

/** ธุรกรรมดิบจาก backend */
export type TxDTO = {
  id: number | string;
  tag_id?: number;
  value?: number;
  amount?: number;
  date: string;
  time?: string;
  type: "income" | "expense";
  tag?: string;
  category?: string;
  note?: string;
};

type CategoriesDataObject = {
  transactions?: TxDTO[];
  categories?: CategoryRow[];
  legacy?: CategoryRow[];
};

type CategoriesAPIResponse =
  | { ok?: boolean; data?: CategoriesDataObject }
  | CategoriesDataObject
  | CategoryRow[];

/* Type Guards */
function hasDataKey(x: unknown): x is { data?: unknown } {
  return (
    !!x && typeof x === "object" && "data" in (x as Record<string, unknown>)
  );
}
function isCategoriesDataObject(x: unknown): x is CategoriesDataObject {
  return !!x && typeof x === "object";
}

/* ───────────────────────────── Utilities ───────────────────────────── */

/** ตรวจว่า date ISO อยู่เดือน/ปีเดียวกันหรือไม่ */
const sameMonth = (dISO: string, y: number, m: number): boolean => {
  const d = new Date(dISO);
  return d.getFullYear() === y && d.getMonth() + 1 === m;
};

/** แปลง unknown → number (NaN → 0) */
const asAmount = (n: unknown): number =>
  Number.isFinite(Number(n)) ? Number(n) : 0;

/* ───────────────────────────── Derive Functions ───────────────────────────── */

/** สรุปยอดรายรับ/รายจ่าย/คงเหลือ */
export function buildSummary(
  txs: TxDTO[],
  y: number,
  m: number
): SummaryPayload {
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

/** สร้าง series รายเดือนทั้งปี (12 จุด) */
export function buildMonthlyTraffic(txs: TxDTO[], y: number): TrafficPoint[] {
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

/** แปลง TrafficPoint → TrafficAreaPoint สำหรับกราฟ */
export const toAreaSeries = (
  tp: TrafficPoint[],
  y: number
): TrafficAreaPoint[] =>
  tp.map((p) => {
    const [mm] = p.month.split("/");
    return {
      date: `${y}-${String(mm).padStart(2, "0")}-01`,
      income: p.income,
      expense: p.expense,
    };
  });

/** รายการธุรกรรมล่าสุด (เรียงใหม่ → เก่า) */
export function buildRecent(txs: TxDTO[]): RecentRow[] {
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

/** แปลงธุรกรรมเป็น series หมวดหมู่ (ใช้ในกราฟโดนัท) */
export function buildCategorySeries(
  txs: TxDTO[],
  y: number,
  m: number,
  type: "income" | "expense" = "expense"
): CategoryRow[] {
  const agg = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    if (!sameMonth(t.date, y, m)) continue;
    const key = t.tag ?? t.category ?? "อื่น ๆ";
    agg.set(key, (agg.get(key) ?? 0) + asAmount(t.value ?? t.amount));
  }
  return [...agg.entries()]
    .map(([category, expense]) => ({ category, expense }))
    .sort((a, b) => b.expense - a.expense);
}

/** นับจำนวนธุรกรรมในเดือน/ปีที่ระบุ */
export const countMonthlyTx = (txs: TxDTO[], y: number, m: number): number =>
  txs.filter((t) => sameMonth(t.date, y, m)).length;

/* ───────────────────────────── Orchestrator ─────────────────────────────
 * getDashboardAll: รวมข้อมูลแดชบอร์ดในครั้งเดียว
 * - ❌ ไม่มี any: ใช้ type guard
 * - รองรับ payload ได้หลายรูปแบบ (data object / array legacy)
 */
export async function getDashboardAll(params: {
  year: number;
  month: number;
  categoryType?: "income" | "expense";
}) {
  const { year, month, categoryType = "expense" } = params;

  const res = await fetchJSONClient<CategoriesAPIResponse>(
    "/api/dashboard/categories?" +
      new URLSearchParams({
        year: String(year),
        month: String(month),
        type: categoryType,
      }).toString()
  );

  const raw: unknown = hasDataKey(res) ? res.data : res;

  const txs: TxDTO[] =
    isCategoriesDataObject(raw) && Array.isArray(raw.transactions)
      ? raw.transactions
      : [];

  const categoriesRaw: CategoryRow[] = (() => {
    if (Array.isArray(raw)) return raw; // legacy array
    if (isCategoriesDataObject(raw)) {
      if (Array.isArray(raw.categories)) return raw.categories;
      if (Array.isArray(raw.legacy)) return raw.legacy;
    }
    return [];
  })() as CategoryRow[];

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

  // fallback: ไม่มี transactions → คิดจาก categoriesRaw
  const totalExpense = categoriesRaw.reduce((s, c) => s + (c.expense ?? 0), 0);

  const summary: SummaryPayload = {
    year,
    month,
    income: 0,
    expense: totalExpense,
    balance: -totalExpense,
  };

  return {
    summary,
    categories: categoriesRaw,
    trafficMonthly: [] as TrafficPoint[],
    trafficArea: [] as TrafficAreaPoint[],
    recent: [] as RecentRow[],
    txCount: 0,
  };
}
