// src/app/api/auth/logout/route.ts

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/logout
 * ลบคุกกี้ mp_token ออกจาก browser เพื่อออกจากระบบ
 * ทำงานฝั่ง server (Edge safe)
 */
export async function GET() {
  const cookie = await cookies();

  // แสดงคุกกี้ทั้งหมดใน log (dev/debug เท่านั้น)
  // console.log(cookie.getAll());

  // ❌ ลบคุกกี้ชื่อ mp_token (JWT access token)
  cookie.delete("mp_token");

  // ✅ ตอบกลับ success
  return NextResponse.json({ message: "Cookie deleted" });
}
