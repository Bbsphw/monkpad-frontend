// src/app/api/month-results/me/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

// บังคับให้ route นี้รันแบบ dynamic เสมอ (ไม่ถูก cache ที่ build time)
export const dynamic = "force-dynamic";

/**
 * GET /api/month-results/me
 * → proxy ไปที่ GET {API}/month_results/{user_id}
 * ขั้นตอน:
 * 1) อ่าน cookie "mp_token"
 * 2) decode JWT เพื่อดึง uid
 * 3) ยิง upstream พร้อมแนบ Bearer token
 * 4) คืนผลลัพธ์แบบ unified { ok, data } หรือ { ok:false, error }
 */
export async function GET() {
  try {
    // --- 1) auth: อ่าน token จากคุกกี้ ---
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    // --- 2) ดึง user id จาก JWT payload ---
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // --- 3) call upstream: month_results ของ user ---
    const upstream = await fetch(`${env.API_BASE_URL}/month_results/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store", // ปิด cache เพื่อให้ได้ข้อมูลล่าสุด
    });

    // พยายามอ่าน JSON (ถ้าผิดพลาดให้เป็น null)
    const js = await upstream.json().catch(() => null);

    // --- 4) ตรวจสถานะ upstream และแมปเป็น error ของเรา ---
    if (!upstream.ok)
      return jsonError(
        upstream.status,
        js?.detail || "Fetch month results failed"
      );

    // --- 5) success: ห่อเป็นรูปแบบ unified ของ FE ---
    return Response.json({ ok: true, data: js });
  } catch (e) {
    // รวม error เป็น JSON ที่สอดคล้องกัน
    return handleRouteError(e);
  }
}
