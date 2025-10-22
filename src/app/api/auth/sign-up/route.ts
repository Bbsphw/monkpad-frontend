// src/app/api/auth/sign-up/route.ts

import { z } from "zod";
import { fetchJSON } from "@/lib/http";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError } from "@/lib/errors";

/**
 * POST /api/auth/sign-up
 * สมัครสมาชิกใหม่
 * - Validate input
 * - เรียก backend: POST /users/add/
 * - ส่ง response unified format { ok: true, data }
 */
const BodySchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    // ✅ ใช้ fetchJSON wrapper เพื่อให้ headers และ error handling เป็นมาตรฐาน
    const data = await fetchJSON<{ message: string; user_id: number }>(
      `${env.API_BASE_URL}/users/add/`,
      { method: "POST", body },
      { noAuth: true } // signup ยังไม่ต้องมี token
    );

    return Response.json({ ok: true, data }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
