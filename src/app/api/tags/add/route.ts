// src/app/api/tags/add/route.ts

import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

const BodySchema = z.object({
  tag: z.string().min(1),
  type: z.enum(["income", "expense"]),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    // อ่าน token จากคุกกี้ + ถอด uid ตรงๆ (ไม่เรียก /api/auth/profile)
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    // ยิง backend พร้อม Authorization และ user_id ตามสเปคฝั่งคุณ
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

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg = js?.detail || "Create tag failed";
      // ถ้า upstream เป็น 401/403 ก็แม็ปเป็น 401 ให้ฟรอนต์จัดการต่อ
      if ([401, 403].includes(upstream.status)) {
        return jsonError(401, "Not authenticated");
      }
      return jsonError(upstream.status, msg);
    }

    return Response.json({ ok: true, data: js });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
