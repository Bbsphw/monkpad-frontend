// // src/app/(protected)/dashboard/_services/dashboard-service.ts

// import { fetchJSONClient } from "@/lib/http-client";
// import type {
//   SummaryPayload,
//   CategoryRow,
//   TrafficPoint,
//   RecentRow,
// } from "../_types/dashboard";

// /** สรุป KPI เดือนปัจจุบัน/ที่เลือก */
// export async function getDashboardSummary(params: {
//   // filter จัดการหน้า dashboard เองดีกว่าเพราะดึง fetchJSONClient จาก backend มันช้าและสิ้นเปลืองการโหลดข้อมูล
//   year: number;
//   month: number;
// }) {
//   const { year, month } = params;
//   const res = await fetchJSONClient<{ data: SummaryPayload }>(
//     "/api/dashboard/summary?" +
//       new URLSearchParams({
//         year: String(year),
//         month: String(month),
//       }).toString()
//   );
//   return res.data;
// }

// /** หมวดหมู่รายจ่าย/รายรับ ของเดือนนั้น */
// export async function getDashboardCategories(params: {
//   year: number;
//   month: number;
//   type?: "income" | "expense";
// }) {
//   const { year, month, type = "expense" } = params;
//   const res = await fetchJSONClient<{ data: CategoryRow[] }>(
//     "/api/dashboard/categories?" +
//       new URLSearchParams({
//         year: String(year),
//         month: String(month),
//         type,
//       }).toString()
//   );
//   return res.data ?? [];
// }

// /** เทรนด์รายเดือน (12 เดือน/ทั้งปี) */
// export async function getDashboardTraffic(params: { year: number }) {
//   // filter จัดการหน้า dashboard เองดีกว่าเพราะดึง fetchJSONClient จาก backend มันช้าและสิ้นเปลืองการโหลดข้อมูล
//   const { year } = params;
//   const res = await fetchJSONClient<{ data: TrafficPoint[] }>(
//     "/api/reports/monthly?" +
//       new URLSearchParams({
//         year: String(year),
//       }).toString()
//   );
//   return res.data ?? [];
// }

// /** รายการล่าสุด (limit เริ่มต้น = 10) */
// export async function getDashboardRecent(limit = 10) {
//   const res = await fetchJSONClient<{ data: RecentRow[] }>(
//     "/api/dashboard/recent?" +
//       new URLSearchParams({
//         limit: String(limit),
//       }).toString()
//   );
//   return res.data ?? [];
// }

// src/app/(protected)/dashboard/_services/dashboard-service.ts
import { fetchJSONClient } from "@/lib/http-client";
import type {
  SummaryPayload,
  TrafficPoint,
  TrafficAreaPoint,
  RecentRow,
  CategoryRow,
} from "../_types/dashboard";

/** รูปร่าง Tx จาก backend */
type TxDTO = {
  id: number | string;
  tag_id?: number;
  value?: number;
  amount?: number;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss | HH:mm
  type: "income" | "expense";
  tag?: string;
  category?: string;
  note?: string;
};
type CategoriesAPIResponse =
  | {
      ok: true;
      data: {
        transactions?: TxDTO[];
        categories?: CategoryRow[];
        legacy?: CategoryRow[];
      };
    }
  | { ok: true; data: CategoryRow[] }
  | any;

/* utilities */
const sameMonth = (dISO: string, y: number, m: number) => {
  const d = new Date(dISO);
  return d.getFullYear() === y && d.getMonth() + 1 === m;
};
const asAmount = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/* derive */
function buildSummary(txs: TxDTO[], y: number, m: number): SummaryPayload {
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
function buildMonthlyTraffic(txs: TxDTO[], y: number): TrafficPoint[] {
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
const toAreaSeries = (tp: TrafficPoint[], y: number): TrafficAreaPoint[] =>
  tp.map((p) => {
    const [mm] = p.month.split("/");
    return {
      date: `${y}-${String(mm).padStart(2, "0")}-01`,
      income: p.income,
      expense: p.expense,
    };
  });
function buildRecent(txs: TxDTO[], limit = 10): RecentRow[] {
  const sorted = [...txs].sort((a, b) =>
    `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`)
  );
  return sorted.slice(0, limit).map((t) => ({
    id: String(t.id),
    date: t.date,
    time: t.time,
    type: t.type,
    category: t.tag ?? t.category ?? "-",
    amount: asAmount(t.value ?? t.amount),
    note: t.note ?? "",
  }));
}
function buildCategorySeries(
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

function countMonthlyTx(txs: TxDTO[], y: number, m: number): number {
  return txs.filter((t) => sameMonth(t.date, y, m)).length;
}

export async function getDashboardAll(params: {
  year: number;
  month: number;
  recentLimit?: number;
  categoryType?: "income" | "expense";
}) {
  const { year, month, recentLimit = 10, categoryType = "expense" } = params;

  const res = await fetchJSONClient<CategoriesAPIResponse>(
    "/api/dashboard/categories?" +
      new URLSearchParams({
        year: String(year),
        month: String(month),
        type: categoryType,
      }).toString()
  );

  const payload = (res as any)?.data ?? res;
  const txs: TxDTO[] = Array.isArray(payload?.transactions)
    ? payload.transactions
    : [];
  const categoriesRaw: CategoryRow[] = Array.isArray(payload?.categories)
    ? payload.categories
    : Array.isArray(payload?.legacy)
    ? payload.legacy
    : Array.isArray(payload)
    ? payload
    : [];

  if (txs.length > 0) {
    const summary = buildSummary(txs, year, month);
    const trafficMonthly = buildMonthlyTraffic(txs, year);
    const trafficArea = toAreaSeries(trafficMonthly, year);
    const recent = buildRecent(txs, recentLimit);
    const categories = buildCategorySeries(txs, year, month, categoryType);
    const txCount = countMonthlyTx(txs, year, month); // ✅ เพิ่มบรรทัดนี้

    return {
      summary,
      categories,
      trafficMonthly,
      trafficArea,
      recent,
      txCount,
    };
  }

  // fallback ถ้า backend ยังไม่ส่ง transactions
  const categories = categoriesRaw;
  const totalExpense = categories.reduce((s, c) => s + (c.expense || 0), 0);
  const summary: SummaryPayload = {
    year,
    month,
    income: 0,
    expense: totalExpense,
    balance: -totalExpense,
  };
  const txCount = 0; // ✅ เพิ่ม fallback

  return {
    summary,
    categories,
    trafficMonthly: [],
    trafficArea: [],
    recent: [],
    txCount,
  };
}
