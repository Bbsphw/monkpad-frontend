// src/app/api/tags/delete/[tagId]/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await ctx.params;
    const id = Number(tagId);
    if (!id) return jsonError(422, "Invalid tag id");

    // อ่าน token จากคุกกี้ + ถอด uid โดยตรง
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    // ยิง backend พร้อม Authorization (require_user บังคับ)
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

    return Response.json({ ok: true, data: js });
  } catch (e) {
    return handleRouteError(e);
  }
}
