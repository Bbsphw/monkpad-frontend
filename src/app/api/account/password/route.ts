// src/app/api/account/password/route.ts

import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

/**
 * PATCH /api/account/password
 * เปลี่ยนรหัสผ่านของผู้ใช้
 * - ตรวจสอบ token จาก cookie
 * - ส่งข้อมูลไป backend: /users/me/password
 */

const Body = z.object({
  currentPassword: z.string().min(8), // รหัสผ่านเก่า
  newPassword: z.string().min(8), // รหัสผ่านใหม่
});

export async function PATCH(req: Request) {
  try {
    // ✅ 1. ตรวจสอบรูปแบบข้อมูลด้วย Zod
    const { currentPassword, newPassword } = Body.parse(await req.json());

    // ✅ 2. ดึง JWT token จาก cookie (ชื่อ mp_token)
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) return jsonError(401, "Not authenticated");

    // ✅ 3. ส่งคำขอไป backend (FastAPI)
    const res = await fetch(`${env.API_BASE_URL}/users/me/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        old_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const json = await res.json().catch(() => null);

    // ✅ 4. ถ้า response error → แปลง error เป็น jsonError()
    if (!res.ok) {
      const message =
        json?.detail || json?.error?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ";
      return jsonError(res.status, message, undefined, json);
    }

    // ✅ 5. ตอบกลับสำเร็จ
    return Response.json({ ok: true, data: json });
  } catch (e) {
    // ✅ 6. แยกกรณี ZodError / API error
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
