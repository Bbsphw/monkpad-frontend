// src/lib/auth-client.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";

export type Profile = { id: number; username: string; email: string };

export async function getProfile(): Promise<Profile> {
  // 1) สร้าง absolute origin สำหรับฝั่ง server
  // - ใช้ NEXT_PUBLIC_APP_URL ก่อน (ให้กำหนดเองชัดเจน)
  // - บน Vercel ถ้าไม่มี ให้ fallback เป็น https://<VERCEL_URL>
  // - สุดท้าย local dev
  //
  // 💡 หมายเหตุ: origin ตรงนี้ใช้เรียก “internal route” ของตัวแอปเอง
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  // 2) ดึงคุกกี้ทั้งหมดแล้วแปลงเป็น header string
  //    เพื่อนำไปแนบตอนเรียก /api/auth/profile (server route)
  //
  // ⚠️ cookies() ของ next/headers เป็น synchronous API
  //    ไม่จำเป็นต้อง await (โค้ดนี้ await ได้ แต่ใน Next รุ่นปัจจุบันไม่ต้อง)
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  // 3) เรียก internal route พร้อมแนบ cookie
  //    - ถ้า ok → ใช้ data และจบ
  //    - ถ้า 401 → โยน unauthorized เพื่อให้ caller ตัดสินใจ redirect
  //    - กรณีอื่น → ปล่อยให้ fallback (ยิงตรง BE ด้วย JWT) ด้านล่าง
  try {
    const res = await fetch(`${origin}/api/auth/profile`, {
      method: "GET",
      cache: "no-store", // ไม่ cache โปรไฟล์
      headers: cookieHeader ? { cookie: cookieHeader } : {}, // แนบคุกกี้จากผู้ใช้
    });

    if (res.ok) {
      const j = (await res.json()) as { ok: boolean; data?: Profile };
      if (j.ok && j.data) return j.data;
      throw new Error("profile payload invalid"); // รูปแบบ payload ไม่ถูกต้อง
    }
    if (res.status === 401) throw new Error("unauthorized"); // ไม่ได้ล็อกอิน
    // อื่น ๆ → fallback ด้านล่าง
  } catch {
    // เงียบ error เพื่อไป fallback ข้อ 4)
  }

  // 4) Fallback: ยิงตรง backend ด้วย uid จาก JWT (ในคุกกี้ mp_token)
  //    - ใช้ decodeJwt เพื่อดึง uid
  //    - เรียก BE ด้วย Bearer token
  const token = cookieStore.get("mp_token")?.value || "";
  if (!token) throw new Error("unauthorized");

  const payload = decodeJwt<{ uid?: number }>(token);
  const uid = payload?.uid;
  if (!uid) throw new Error("unauthorized");

  const res2 = await fetch(`${env.API_BASE_URL}/users/${uid}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`, // ส่ง token ตรงไป BE
      Accept: "application/json",
    },
  });

  if (!res2.ok) throw new Error("unauthorized");
  return (await res2.json()) as Profile;
}
