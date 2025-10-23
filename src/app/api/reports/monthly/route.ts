// src/app/api/reports/monthly/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/* ───────────────────────────── Types ─────────────────────────────
 * 1) รูปทรงข้อมูลจาก upstream (หยาบ ๆ) → เราจะ normalize เอง
 * 2) จุดข้อมูลที่ FE ต้องการใช้กับกราฟ
 */
type UpstreamMonthRow = {
  month?: unknown; // อาจเป็นเลขหรือสตริงจาก backend
  income?: unknown; // อาจเป็น number|string
  expense?: unknown; // อาจเป็น number|string
  // มีฟิลด์อื่นได้ แต่เราไม่ใช้
  [k: string]: unknown;
};

type MonthlySeriesPoint = {
  month: string; // รูปแบบ "MM/YY"
  income: number; // ปลอดภัยเป็น number แล้ว
  expense: number; // ปลอดภัยเป็น number แล้ว
};

/* ───────────────────────────── Utils ─────────────────────────────
 * ตัวช่วยแปลง unknown → ชนิดที่เราต้องการ โดยไม่ใช้ any
 */

/** ปลอดภัยจาก NaN → ถ้าแปลงไม่ได้จะคืน 0 */
function toNumber(n: unknown): number {
  const v = typeof n === "string" ? Number(n.trim()) : Number(n);
  return Number.isFinite(v) ? v : 0;
}

/** ดึงค่า month ที่เป็น 1..12 จาก unknown (รับได้ทั้ง "1", 1, "01" ฯลฯ) */
function getMonthIndex(m: unknown): number | null {
  const num = toNumber(m);
  if (Number.isInteger(num) && num >= 1 && num <= 12) return num;
  // เผื่อกรณีเป็นสตริงที่มีเลขนำหน้า เช่น "03"
  if (typeof m === "string") {
    const mm = Number(m.slice(0, 2));
    if (Number.isInteger(mm) && mm >= 1 && mm <= 12) return mm;
  }
  return null;
}

/** แปลง unknown → UpstreamMonthRow[] อย่างปลอดภัย */
function asUpstreamRows(input: unknown): UpstreamMonthRow[] {
  if (!Array.isArray(input)) return [];
  return input.map((r) =>
    typeof r === "object" && r ? (r as UpstreamMonthRow) : {}
  );
}

/** แปลง UpstreamMonthRow[] → MonthlySeriesPoint[] (normalize + sort) */
function toMonthlySeries(
  rows: UpstreamMonthRow[],
  year: number
): MonthlySeriesPoint[] {
  const yy = String(year).slice(-2);

  // normalize
  const normalized: MonthlySeriesPoint[] = rows
    .map((r) => {
      const m = getMonthIndex(r.month);
      if (m == null) return null; // ทิ้งแถวที่เดือนผิดรูป
      return {
        month: `${String(m).padStart(2, "0")}/${yy}`,
        income: toNumber(r.income),
        expense: toNumber(r.expense),
      };
    })
    .filter((v): v is MonthlySeriesPoint => v !== null);

  // sort ตามเดือน 01..12
  normalized.sort(
    (a, b) => Number(a.month.slice(0, 2)) - Number(b.month.slice(0, 2))
  );

  return normalized;
}

/**
 * GET /api/reports/monthly?year=2025
 * - เรียกผลสรุปรายเดือนทั้งปีจาก BE (month_results/{uid}/{year})
 * - แปลงเป็น series สำหรับกราฟ: [{ month: "MM/YY", income, expense }]
 */
export async function GET(req: Request) {
  try {
    // ----- validate year -----
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    if (!Number.isFinite(year)) return jsonError(422, "year is required");

    // ----- auth -----
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // ----- upstream: ดึง month_results ทั้งปี -----
    const upstream = await fetch(
      `${env.API_BASE_URL}/month_results/${uid}/${year}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const js: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const detail =
        js && typeof js === "object" && "detail" in js
          ? String((js as { detail?: unknown }).detail ?? "")
          : "";
      return jsonError(upstream.status, detail || "month-results failed");
    }

    // ----- normalize + sort เป็น series "MM/YY" -----
    const rows = asUpstreamRows(js);
    const series = toMonthlySeries(rows, year);

    return Response.json({ ok: true, data: series });
  } catch (e) {
    return handleRouteError(e);
  }
}
