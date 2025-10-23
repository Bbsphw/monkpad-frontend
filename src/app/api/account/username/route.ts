// src/app/api/account/username/route.ts

import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

/**
 * PATCH /api/account/username
 * เปลี่ยนชื่อผู้ใช้ (username)
 * - ตรวจสอบ JWT token จาก cookie
 * - ยิงไป backend: /users/me/username
 */

const Body = z.object({
  newUsername: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[A-Za-z0-9_.-]+$/), // จำกัดเฉพาะ a-z, 0-9, _, ., -
  password: z.string().min(8),
});

export async function PATCH(req: Request) {
  try {
    // ✅ 1. ตรวจสอบข้อมูล input ด้วย Zod
    const { newUsername, password } = Body.parse(await req.json());

    // ✅ 2. ดึง JWT token จาก cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) return jsonError(401, "Not authenticated");

    // ✅ 3. ส่งไป backend (FastAPI)
    const res = await fetch(`${env.API_BASE_URL}/users/me/username`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        new_username: newUsername,
        password,
      }),
    });

    const json = await res.json().catch(() => null);

    // ✅ 4. ถ้ามี error → รวมข้อความจาก backend
    if (!res.ok) {
      const message =
        json?.detail || json?.error?.message || "เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ";
      return jsonError(res.status, message, undefined, json);
    }

    // ✅ 5. ตอบกลับสำเร็จ
    return Response.json({ ok: true, data: json });
  } catch (e) {
    // ✅ 6. handle ZodError และข้อผิดพลาดทั่วไป
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
