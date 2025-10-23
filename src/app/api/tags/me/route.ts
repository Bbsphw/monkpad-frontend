// src/app/api/tags/me/route.ts

import { cookies } from "next/headers";
import { decodeJwt } from "@/lib/jwt";
import { fetchJSON } from "@/lib/http";
import { handleRouteError, jsonError } from "@/lib/errors";

/**
 * GET /api/tags/me
 * - อ่าน token จากคุกกี้ → ถอด uid จาก JWT
 * - เรียก upstream (ผ่านยูทิล fetchJSON) เพื่อดึงแท็กทั้งหมดของผู้ใช้
 * - คืน payload มาตรฐาน { ok: true, data }
 */
export async function GET() {
  try {
    // ---- อ่านคุกกี้และตรวจสอบการล็อกอิน ----
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) return jsonError(401, "Not authenticated");

    // ---- ถอด JWT เพื่อหา user id ----
    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    // ---- ดึง tag ของผู้ใช้ (ฝั่ง BE ป้องกัน auth อยู่แล้ว) ----
    // ข้อดีของ fetchJSON: รวมการ set header/จัดการ error ให้สม่ำเสมอ
    const tags = await fetchJSON<unknown[]>(`/tags/${uid}`);

    // ---- ส่งกลับรูปแบบมาตรฐาน ----
    return Response.json({ ok: true, data: tags });
  } catch (e) {
    // แปลง error ให้เป็น JSON และ status code ที่อ่านง่าย
    return handleRouteError(e);
  }
}
