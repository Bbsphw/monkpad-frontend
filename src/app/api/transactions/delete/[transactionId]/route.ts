// src/app/api/transactions/delete/[transactionId]/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * ลบธุรกรรม
 * DELETE /api/transactions/delete/:transactionId
 * - ตรวจค่า id ให้ถูกต้อง
 * - แนบ Bearer token แล้ว proxy ไปที่ BE
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ transactionId: string }> }
) {
  try {
    // ✅ อ่านและ validate พารามิเตอร์
    const { transactionId } = await ctx.params;
    const tid = Number(transactionId);
    if (!Number.isFinite(tid) || tid <= 0) {
      return jsonError(422, "Invalid transaction id");
    }

    // ✅ auth: อ่าน token จากคุกกี้ (ไม่ต้องถอด uid เพราะ endpoint ใช้ tid ตรง ๆ)
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    // ✅ ยิง upstream ลบรายการ
    const upstream = await fetch(
      `${env.API_BASE_URL}/transactions/delete/${tid}`,
      {
        method: "DELETE",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg = js?.detail || "Delete transaction failed";
      return jsonError(upstream.status, msg);
    }

    // ✅ สำเร็จ
    return Response.json({ ok: true, data: js });
  } catch (e) {
    return handleRouteError(e);
  }
}
