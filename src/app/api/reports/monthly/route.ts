// src/app/api/reports/monthly/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/reports/monthly?year=2025 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    if (!Number.isFinite(year)) return jsonError(422, "year is required");

    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

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
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok)
      return jsonError(upstream.status, js?.detail || "month-results failed");

    const series = (Array.isArray(js) ? js : [])
      .map((r: any) => ({
        month: `${String(r.month).padStart(2, "0")}/${String(year).slice(-2)}`,
        income: Number(r.income ?? 0) || 0,
        expense: Number(r.expense ?? 0) || 0,
      }))
      .sort(
        (a, b) => Number(a.month.slice(0, 2)) - Number(b.month.slice(0, 2))
      );

    return Response.json({ ok: true, data: series });
  } catch (e) {
    return handleRouteError(e);
  }
}
