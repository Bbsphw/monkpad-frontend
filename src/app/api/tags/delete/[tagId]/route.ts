// src/app/api/tags/delete/[tagId]/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/tags/delete/:tagId
 * - ลบแท็กของผู้ใช้ (ฝั่ง BE จะเช็กสิทธิ์ตาม uid ให้)
 * - ถ้าแท็กเป็น default ฝั่ง FE ควรป้องกันก่อนกดลบ (ทำแล้วใน UI)
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ tagId: string }> }
) {
  try {
    // ---- อ่านพารามิเตอร์ path และ validate ----
    const { tagId } = await ctx.params;
    const id = Number(tagId);
    if (!id) return jsonError(422, "Invalid tag id");

    // ---- auth: token + uid ----
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    // ---- upstream: ส่งคำสั่งลบ ----
    // เส้นทาง BE: /tags/delete/{user_id}/{tag_id}
    const upstream = await fetch(
      `${env.API_BASE_URL}/tags/delete/${uid}/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg = js?.detail || "Delete tag failed";
      if ([401, 403].includes(upstream.status)) {
        return jsonError(401, "Not authenticated");
      }
      return jsonError(upstream.status, msg);
    }

    // ---- สำเร็จ ----
    return Response.json({ ok: true, data: js });
  } catch (e) {
    return handleRouteError(e);
  }
}
