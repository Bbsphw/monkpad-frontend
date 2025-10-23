// src/app/api/transactions/me/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * ดึงธุรกรรมทั้งหมดของผู้ใช้ (ตามสเปค BE คือ /transactions/{user_id})
 * GET /api/transactions/me
 * - อ่าน token → ถอด uid
 * - proxy ไปยัง BE → คืนเฉพาะ field 'transactions' หรือ [] ถ้าไม่มี
 */
export async function GET() {
  try {
    // ✅ auth
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // ✅ upstream
    const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok)
      return jsonError(
        upstream.status,
        js?.detail || "Fetch transactions failed"
      );

    // ✅ frontend ฝั่งคุณใช้เฉพาะ array → คืนเท่าที่ต้องการ
    return Response.json({ ok: true, data: js?.transactions ?? [] });
  } catch (e) {
    return handleRouteError(e);
  }
}
