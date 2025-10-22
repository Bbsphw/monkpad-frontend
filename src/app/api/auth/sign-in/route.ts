// src/app/api/auth/sign-in/route.ts

import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { z } from "zod";

/**
 * POST /api/auth/sign-in
 * เข้าสู่ระบบ
 * - Validate body ด้วย Zod
 * - ส่ง request ไป backend FastAPI (/auth/login)
 * - ตั้งคุกกี้ mp_token (JWT) สำหรับ session
 */

const BodySchema = z.object({
  username: z.string(),
  password: z.string(),
  remember: z.boolean().optional(), // ใช้กำหนดอายุคุกกี้ (7 วัน)
});

// 🔒 ตรวจว่า request ใช้ HTTPS หรือไม่ (ใช้กำหนด flag Secure)
function isHttps(req: Request) {
  const xfProto = req.headers.get("x-forwarded-proto");
  if (xfProto) return xfProto.split(",")[0].trim() === "https";
  return process.env.NODE_ENV === "production";
}

export async function POST(req: Request) {
  try {
    // ✅ 1. ตรวจสอบ input
    const body = BodySchema.parse(await req.json());

    // ✅ 2. ยิงไป backend เพื่อขอ token
    const upstream = await fetch(`${env.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: body.username,
        password: body.password,
      }),
    });

    const json = await upstream.json().catch(() => null);

    // ✅ 3. ตรวจสอบ token ที่ได้จาก backend
    if (!upstream.ok || !json?.access_token) {
      const msg = json?.detail || json?.error || "Invalid credentials";
      return jsonError(upstream.status, msg);
    }

    // ✅ 4. สร้าง cookie mp_token
    const token = String(json.access_token);
    const remember = !!body.remember;
    const maxAge = remember ? 7 * 24 * 60 * 60 : undefined; // 7 วัน
    const exp = maxAge
      ? new Date(Date.now() + maxAge * 1000).toUTCString()
      : undefined;
    const secure = isHttps(req);

    const parts = [
      `mp_token=${token}`,
      "Path=/",
      "HttpOnly", // ป้องกันการเข้าถึงจาก JS
      "SameSite=Lax",
    ];
    if (secure) parts.push("Secure");
    if (maxAge) {
      parts.push(`Max-Age=${maxAge}`);
      parts.push(`Expires=${exp}`);
    }

    // ✅ 5. ส่ง response กลับ พร้อมแนบ cookie header
    const res = Response.json({ ok: true });
    res.headers.append("Set-Cookie", parts.join("; "));
    return res;
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
