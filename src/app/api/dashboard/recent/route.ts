// src/app/api/dashboard/recent/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/**
 * GET /api/dashboard/recent?limit=10
 * - Auth ด้วย JWT
 * - ดึงธุรกรรมทั้งหมดของ user แล้ว sort ตาม date/time (ล่าสุดก่อน)
 * - ตัดมาจำนวนไม่เกิน limit (1..100)
 */
export async function GET(req: Request) {
  try {
    // --- 1) parse limit ด้วย guard 1..100 ---
    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? "10"), 1),
      100
    );

    // --- 2) auth ---
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // --- 3) fetch upstream ---
    const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok)
      return jsonError(upstream.status, js?.detail || "transactions failed");

    // --- 4) normalize + sort ล่าสุดก่อน ---
    const rows = Array.isArray(js?.transactions) ? js.transactions : [];
    rows.sort((a: any, b: any) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
    );

    // --- 5) slice ตาม limit แล้วคืนรูปแบบ unified ---
    return Response.json({ ok: true, data: rows.slice(0, limit) });
  } catch (e) {
    return handleRouteError(e);
  }
}
