// src/app/api/tags/add/route.ts

import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

/**
 * POST /api/tags/add
 * Body: { tag: string, type: "income" | "expense" }
 * - Validate ด้วย Zod
 * - อ่าน token + uid
 * - ยิงไป BE: /tags/add/ พร้อม Authorization และ user_id
 */
const BodySchema = z.object({
  tag: z.string().min(1),
  type: z.enum(["income", "expense"]),
});

export async function POST(req: Request) {
  try {
    // ---- ตรวจและแปลง body ----
    const body = BodySchema.parse(await req.json());

    // ---- auth: เอา token จากคุกกี้ และ uid จาก JWT ----
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    // ---- upstream: สร้าง tag ใหม่ พร้อมแนบ Authorization ----
    const upstream = await fetch(`${env.API_BASE_URL}/tags/add/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        user_id: uid,
        tag: body.tag,
        type: body.type,
      }),
      cache: "no-store",
    });

    // พยายามอ่าน JSON เพื่อนำข้อความผิดพลาดมาแม็ป
    const js = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      // ข้อความจาก backend (FastAPI) มักอยู่ใน field 'detail'
      const msg = js?.detail || "Create tag failed";
      // แม็ป 401/403 จาก upstream → 401 ฝั่ง FE ให้รีไดเรกต์/ลอกอินใหม่ได้
      if ([401, 403].includes(upstream.status)) {
        return jsonError(401, "Not authenticated");
      }
      return jsonError(upstream.status, msg);
    }

    // ---- สำเร็จ ----
    return Response.json({ ok: true, data: js });
  } catch (e) {
    // แยกกรณี ZodError → 422 ชัดเจน
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
