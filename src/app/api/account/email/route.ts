// src/app/api/account/email/route.ts

import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

/**
 * PATCH /api/account/email
 * เปลี่ยนอีเมลของผู้ใช้
 * - รับข้อมูลจาก Body: newEmail, password
 * - ตรวจสอบ JWT token จาก cookie (ชื่อ mp_token)
 * - ส่งคำขอไป backend FastAPI: PATCH /users/me/email
 */

const Body = z.object({
  newEmail: z.string().email(), // ต้องเป็นอีเมลที่ถูกต้องตามรูปแบบ
  password: z.string().min(8), // รหัสผ่านเดิม อย่างน้อย 8 ตัวอักษร
});

export async function PATCH(req: Request) {
  try {
    // ✅ 1. Parse และ validate body ด้วย Zod
    const { newEmail, password } = Body.parse(await req.json());

    // ✅ 2. ดึง token จาก cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) return jsonError(401, "Not authenticated");

    // ✅ 3. ยิงไป backend API (FastAPI)
    const res = await fetch(`${env.API_BASE_URL}/users/me/email`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // แนบ JWT จาก cookie
        Accept: "application/json",
      },
      body: JSON.stringify({
        new_email: newEmail, // payload ที่ backend ต้องการ
        password,
      }),
    });

    // ✅ 4. แปลง response กลับเป็น JSON (ถ้าเป็น JSON)
    const json = await res.json().catch(() => null);

    // ✅ 5. ถ้า error → สร้าง response มาตรฐานด้วย jsonError()
    if (!res.ok) {
      const message =
        json?.detail || json?.error?.message || "เปลี่ยนอีเมลไม่สำเร็จ";
      return jsonError(res.status, message, undefined, json);
    }

    // ✅ 6. ส่ง response success แบบ unified format { ok: true, data }
    return Response.json({ ok: true, data: json });
  } catch (e) {
    // ✅ 7. handle validation error (Zod) และ unexpected error
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
