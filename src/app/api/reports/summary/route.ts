// src/app/api/reports/summary/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/* ───────────────────────────── Types ─────────────────────────────
 * อธิบายรูปแบบข้อมูลที่เรารอรับจาก upstream API ชัดเจน
 */

/** แถวข้อมูลสรุปรายเดือนจาก `/month_results/{uid}/{year}` */
type MonthResultRow = {
  month: number | string; // backend อาจส่งมาเป็น number หรือ string
  income?: number | null;
  expense?: number | null;
};

/** ธุรกรรมที่สนใจใช้ในไฟล์นี้ (date/type) */
type TransactionDTO = {
  date: string; // ISO date string (YYYY-MM-DD)
  type: "income" | "expense";
};

/** payload จาก `/transactions/{uid}` */
type TransactionsPayload = {
  transactions?: TransactionDTO[];
} | null;

/* ───────────────────────────── Helpers ─────────────────────────────
 * type guard / parser เล็ก ๆ สำหรับ validate แบบหลวม ๆ
 */

/** ตรวจว่าเป็น array ของ MonthResultRow อย่างคร่าว ๆ */
function asMonthResultArray(input: unknown): MonthResultRow[] {
  return Array.isArray(input) ? (input as MonthResultRow[]) : [];
}

/** ดึง array ของธุรกรรมจาก payload ที่อาจ null/รูปทรงไม่แน่นอน */
function extractTransactions(input: unknown): TransactionDTO[] {
  const obj = (input ?? {}) as { transactions?: unknown };
  return Array.isArray(obj.transactions)
    ? (obj.transactions as TransactionDTO[])
    : [];
}

/** ตรวจเดือน/ปีของวันที่ ISO ให้ตรงกับที่ระบุ */
function inYearMonth(dISO: string, y: number, m: number): boolean {
  const d = new Date(dISO);
  return d.getFullYear() === y && d.getMonth() + 1 === m;
}

/**
 * GET /api/reports/summary
 * ตัวอย่าง:
 *  - MONTH mode: /api/reports/summary?mode=MONTH&year=2025&month=6&type=all
 *    → สรุปเดือนที่ระบุ (income/expense/balance + จำนวนธุรกรรม) โดยนับธุรกรรมตาม type ที่เลือก (all|income|expense)
 *
 *  - RANGE mode: /api/reports/summary?mode=RANGE&year=2025
 *    → สรุปทั้งปี (income/expense/balance + จำนวนธุรกรรมทั้งปี)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // mode = MONTH | RANGE (ดีฟอลต์เป็น MONTH)
    const mode = (url.searchParams.get("mode") ?? "MONTH") as "MONTH" | "RANGE";
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const type = (url.searchParams.get("type") ?? "all") as
      | "all"
      | "income"
      | "expense";

    if (!Number.isFinite(year)) return jsonError(422, "year is required");

    // ----- auth -----
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // ----- upstream: ดึง month_results ของปีนั้นทั้งหมด -----
    const mr = await fetch(`${env.API_BASE_URL}/month_results/${uid}/${year}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    // พยายาม parse JSON หากพังให้เป็น null แล้วใช้ fallback ที่ปลอดภัย
    const mrJs: unknown = await mr.json().catch(() => null);
    if (!mr.ok)
      return jsonError(
        mr.status,
        (mrJs as { detail?: string } | null)?.detail || "month-results failed"
      );

    // ✅ rows: เป็น array ของ MonthResultRow (แทน any[])
    const rows: MonthResultRow[] = asMonthResultArray(mrJs);

    // ===== โหมด MONTH: สรุปเฉพาะเดือน =====
    if (mode === "MONTH") {
      if (!Number.isFinite(month) || month < 1 || month > 12)
        return jsonError(422, "month is required (1–12)");

      // สรุปรายเดือนจาก month_results → หา row ตามเดือน
      const row =
        rows.find((r) => Number(r.month) === month) ??
        (null as MonthResultRow | null);
      const income = Number(row?.income ?? 0) || 0;
      const expense = Number(row?.expense ?? 0) || 0;

      // ดึงธุรกรรมทั้งหมดของผู้ใช้เพื่อ "นับ" จำนวนรายการในเดือนนั้น (กรองตาม type)
      const tr = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const trJs: TransactionsPayload = await tr.json().catch(() => null);
      const txAll: TransactionDTO[] = extractTransactions(trJs);

      // ✅ txRows: array ของธุรกรรมที่ตรงเดือน/ปี และตรง type (ถ้าเลือก)
      const txRows = txAll.filter((r) => {
        const inYM = inYearMonth(r.date, year, month);
        const typeOk = type === "all" ? true : r.type === type;
        return inYM && typeOk;
      });

      return Response.json({
        ok: true,
        data: {
          summary: {
            income,
            expense,
            balance: income - expense,
            transactions: txRows.length,
          },
        },
      });
    }

    // ===== โหมด RANGE: (ย่อ) รวมทั้งปี =====
    const income = rows.reduce((s, r) => s + (Number(r.income ?? 0) || 0), 0);
    const expense = rows.reduce((s, r) => s + (Number(r.expense ?? 0) || 0), 0);

    // นับจำนวนธุรกรรมทั้งปี (ตรงปีอย่างเดียว ไม่กรอง type)
    const tr = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const trJs: TransactionsPayload = await tr.json().catch(() => null);
    const txAll: TransactionDTO[] = extractTransactions(trJs);
    const txRows = txAll.filter((r) => new Date(r.date).getFullYear() === year);

    return Response.json({
      ok: true,
      data: {
        summary: {
          income,
          expense,
          balance: income - expense,
          transactions: txRows.length,
        },
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
