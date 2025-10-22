// src/app/api/dashboard/summary/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/**
 * GET /api/dashboard/summary?year=2025&month=6
 * - Validate year/month
 * - Auth ด้วย JWT
 * - ดึงผลรวมรายเดือน (ทั้งปี) ของ user จาก upstream: /month_results/:uid/:year
 * - เลือก row ที่เป็นเดือนที่ร้องขอ แล้วคืน income/expense/balance
 */
export async function GET(req: Request) {
  try {
    // --- 1) parse & validate ---
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    if (!Number.isFinite(year)) return jsonError(422, "year is required");
    if (!Number.isFinite(month) || month < 1 || month > 12)
      return jsonError(422, "month is required (1-12)");

    // --- 2) auth ---
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // --- 3) fetch upstream: month_results ทั้งปี ---
    const upstream = await fetch(
      `${env.API_BASE_URL}/month_results/${uid}/${year}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok)
      return jsonError(upstream.status, js?.detail || "month-results failed");

    // --- 4) pick เดือนที่ต้องการ + ใส่ default 0 ถ้าหาไม่เจอ ---
    const row = (Array.isArray(js) ? js : []).find(
      (r: any) => Number(r.month) === month
    );
    const income = Number(row?.income ?? 0) || 0;
    const expense = Number(row?.expense ?? 0) || 0;
    const balance = income - expense;

    // --- 5) response ---
    return Response.json({
      ok: true,
      data: { year, month, income, expense, balance },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
