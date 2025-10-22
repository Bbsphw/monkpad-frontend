// src/app/api/auth/profile/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

type Profile = { id: number; username: string; email: string };

/**
 * GET /api/auth/profile
 * อ่านข้อมูลโปรไฟล์ของผู้ใช้จาก backend ผ่าน token ในคุกกี้
 * - ดึง JWT (`mp_token`) จาก cookie
 * - decode JWT → uid
 * - ยิงต่อไปยัง backend: GET /users/:uid
 */
export async function GET() {
  try {
    // ✅ 1. อ่าน token จาก cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    // ✅ 2. ถอดรหัส JWT เพื่อหาค่า uid
    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    // ✅ 3. เรียก backend API เพื่อดึงข้อมูลผู้ใช้
    const res = await fetch(`${env.API_BASE_URL}/users/${uid}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    // ✅ 4. handle error จาก upstream
    if (!res.ok) {
      if ([401, 403, 404, 422].includes(res.status)) {
        return jsonError(401, "Not authenticated");
      }

      // ถ้าเป็น error อื่น เช่น 500 → ส่ง detail กลับไป
      const ct = res.headers.get("content-type") || "";
      let detail: unknown;
      try {
        detail = ct.includes("application/json")
          ? await res.json()
          : await res.text();
      } catch {}
      return jsonError(
        502,
        `Upstream error (${res.status})`,
        undefined,
        detail
      );
    }

    // ✅ 5. สำเร็จ → ส่งข้อมูลกลับในรูปแบบ unified { ok: true, data }
    const data = (await res.json()) as Profile;
    return Response.json({ ok: true, data });
  } catch (e) {
    // ✅ 6. จัดการ error รวม (log / ส่ง response)
    return handleRouteError(e);
  }
}
