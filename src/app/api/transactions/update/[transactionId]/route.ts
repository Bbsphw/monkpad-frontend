// src/app/api/transactions/update/[transactionId]/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic"; // บังคับให้เป็น dynamic route เสมอ (ไม่ cache ที่ edge)

//
// สคีมารับข้อมูลอัปเดตธุรกรรม
// - ทุกฟิลด์เป็น optional (อัปเดตเฉพาะที่ส่งมา)
// - ครอบด้วย validation ขั้นพื้นฐาน (รูปแบบวันที่/เวลา, ความยาว note, จำนวนเงิน > 0)
//
const BodySchema = z.object({
  tag_id: z.number().int().positive().optional(), // id หมวดหมู่ (จำนวนเต็มบวก)
  value: z.number().positive().optional(), // จำนวนเงิน > 0
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/) // รูปแบบ HH:MM (วินาทีไม่รองรับ)
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/) // รูปแบบ YYYY-MM-DD
    .optional(),
  note: z.string().max(500).optional(), // รายละเอียดไม่เกิน 500 ตัวอักษร
});

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ transactionId: string }> }
) {
  try {
    // --- อ่านและตรวจสอบพารามิเตอร์ path :transactionId ---
    const { transactionId } = await ctx.params;
    const tid = Number(transactionId);
    if (!Number.isFinite(tid) || tid <= 0)
      return jsonError(422, "Invalid transaction id");

    // --- parse + validate body ด้วย Zod ---
    // หมายเหตุ: ถ้า body ว่างเปล่า {} ก็จะผ่าน (เพราะทุกฟิลด์ optional)
    // หากต้องการบังคับ "ต้องมีอย่างน้อย 1 ฟิลด์" สามารถ .refine(Object.keys(d).length>0) เพิ่มได้
    const body = BodySchema.parse(await req.json());

    // --- ตรวจ auth จากคุกกี้ (ไม่ต้องถอด uid เพราะอัปเดตด้วย tid โดยตรง) ---
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    // --- proxy → upstream พร้อมแนบ Bearer token ---
    const upstream = await fetch(
      `${env.API_BASE_URL}/transactions/update/${tid}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(body), // ส่งเฉพาะฟิลด์ที่มีมา
        cache: "no-store",
      }
    );

    // พยายามอ่าน JSON เพื่อให้ดึงรายละเอียด error ได้
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      // map 401/403 จาก BE → 401 ฝั่ง FE เพื่อให้ flow ออกจากระบบถูกต้อง
      if ([401, 403].includes(upstream.status))
        return jsonError(401, "Not authenticated");
      return jsonError(
        upstream.status,
        js?.detail || "Update transaction failed"
      );
    }

    // --- สำเร็จ: คืน payload ตามรูปแบบ FE ใช้งาน ---
    return Response.json({ ok: true, data: js });
  } catch (e) {
    // ZodError → 422 พร้อมข้อความแรกที่อ่านง่าย
    if (e instanceof z.ZodError) return handleZodError(e);
    // อื่น ๆ → 500 + log ภายใน handleRouteError
    return handleRouteError(e);
  }
}
