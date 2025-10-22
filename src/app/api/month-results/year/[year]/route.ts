// src/app/api/month-results/year/[year]/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

// บังคับ dynamic (ไม่ cache ล่วงหน้า)
export const dynamic = "force-dynamic";

/**
 * GET /api/month-results/year/[year]
 * → proxy ไปที่ GET {API}/month_results/{user_id}/{year}
 * ขั้นตอน:
 * 1) validate param year
 * 2) auth + ดึง uid จาก JWT
 * 3) ยิง upstream พร้อม token
 * 4) คืน { ok:true, data } หรือ jsonError ตามสถานการณ์
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ year: string }> }
) {
  try {
    // --- 1) รับ year จาก dynamic route และ validate ---
    const { year } = await ctx.params;
    const y = Number(year);
    // ป้องกัน NaN และปีที่ไม่สมเหตุผล (>= 1970 พอเป็นเกณฑ์ทั่วไป)
    if (!Number.isFinite(y) || y < 1970) return jsonError(422, "Invalid year");

    // --- 2) auth: อ่าน token และดึง uid ---
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // --- 3) call upstream: month_results ของ user เฉพาะปีที่ขอ ---
    const upstream = await fetch(
      `${env.API_BASE_URL}/month_results/${uid}/${y}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const js = await upstream.json().catch(() => null);

    // --- 4) แปลง error เป็นรูปแบบของเรา ถ้า upstream ล้มเหลว ---
    if (!upstream.ok)
      return jsonError(
        upstream.status,
        js?.detail || "Fetch month results by year failed"
      );

    // --- 5) สำเร็จ: คืน payload ให้ FE ---
    return Response.json({ ok: true, data: js });
  } catch (e) {
    return handleRouteError(e);
  }
}
