// src/app/api/password/forgot/route.ts

import { z } from "zod";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

/**
 * API: POST /api/password/forgot
 * ใช้เมื่อผู้ใช้ “ลืมรหัสผ่าน”
 * - ตรวจสอบอีเมลด้วย Zod
 * - เรียก backend /password/forgot เพื่อให้ระบบส่งรหัสยืนยัน (OTP / Reset code) ไปทางอีเมล
 * - backend ส่วนมากจะตอบ 200 เสมอเพื่อความปลอดภัย (ไม่บอกว่ามีอีเมลนี้หรือไม่)
 */
const Body = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"), // ต้องเป็นอีเมลที่ถูกต้อง
});

export async function POST(req: Request) {
  try {
    // ✅ validate body ด้วย Zod
    const { email } = Body.parse(await req.json());

    // ✅ เรียก backend (FastAPI / Django / etc.)
    const res = await fetch(`${env.API_BASE_URL}/password/forgot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    // ✅ backend ส่วนใหญ่ตอบ 200 เสมอ (แม้ไม่พบอีเมล) แต่บางกรณีอาจตอบ 429 (rate limit)
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.detail || "ไม่สามารถส่งรหัสได้ โปรดลองอีกครั้ง";
      return jsonError(res.status, msg, undefined, json);
    }

    // ✅ สำเร็จ → คืนข้อมูลมาตรฐาน { ok: true, data }
    return Response.json({ ok: true, data: json });
  } catch (e) {
    // ZodError → แสดงข้อความ validation ชัดเจน
    if (e instanceof z.ZodError) return handleZodError(e);
    // Error อื่น ๆ → 500 พร้อม log ภายใน handleRouteError
    return handleRouteError(e);
  }
}
