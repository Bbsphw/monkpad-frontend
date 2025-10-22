// src/app/api/transactions/add/route.ts

import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

/**
 * สร้างธุรกรรมใหม่
 * POST /api/transactions/add
 * body: { tag_id, value, date(YYYY-MM-DD), time(HH:MM), note? }
 * - ตรวจความถูกต้องด้วย Zod
 * - อ่าน token จากคุกกี้ → ถอด uid จาก JWT
 * - ยิง upstream → /transactions/add/
 */
const BodySchema = z.object({
  tag_id: z.number().int().positive(), // id หมวดหมู่ ต้องเป็นจำนวนเต็มบวก
  value: z.number().positive(), // จำนวนเงิน > 0
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // รูปแบบ YYYY-MM-DD
  time: z.string().regex(/^\d{2}:\d{2}$/), // รูปแบบ HH:MM (วินาทีไม่รองรับ)
  note: z.string().max(500).optional().default(""),
});

export async function POST(req: Request) {
  try {
    // ✅ validate body ก่อนเสมอ
    const body = BodySchema.parse(await req.json());

    // ✅ auth: ดึง token + ถอด uid
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // ✅ ยิง upstream พร้อมแนบ Authorization
    const upstream = await fetch(`${env.API_BASE_URL}/transactions/add/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        user_id: uid,
        tag_id: body.tag_id,
        value: body.value,
        date: body.date,
        time: body.time,
        note: body.note,
      }),
      cache: "no-store",
    });

    // พยายามอ่าน JSON เพื่อดึงข้อความ error จากฝั่ง BE
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      // แปลง 401/403 ของ BE เป็น 401 ฝั่ง FE เพื่อให้ flow logout ทำงาน
      if ([401, 403].includes(upstream.status))
        return jsonError(401, "Not authenticated");
      return jsonError(
        upstream.status,
        js?.detail || "Create transaction failed"
      );
    }

    // ✅ สำเร็จ → คืน { ok: true, data }
    return Response.json({ ok: true, data: js });
  } catch (e) {
    // แยก ZodError ให้เป็น 422 ชัดเจน
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
