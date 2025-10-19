// src/lib/auth-client.ts
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";

export type Profile = { id: number; username: string; email: string };

export async function getProfile(): Promise<Profile> {
  // 1) สร้าง absolute origin สำหรับฝั่ง server
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  // 2) ดึงคุกกี้ทั้งหมดแล้วแปลงเป็น header string
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  // 3) เรียก internal route พร้อมแนบ cookie
  try {
    const res = await fetch(`${origin}/api/auth/profile`, {
      method: "GET",
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });

    if (res.ok) {
      const j = (await res.json()) as { ok: boolean; data?: Profile };
      if (j.ok && j.data) return j.data;
      throw new Error("profile payload invalid");
    }
    if (res.status === 401) throw new Error("unauthorized");
    // อื่น ๆ → fallback ด้านล่าง
  } catch {
    // fallback ต่อไป
  }

  // 4) Fallback: ยิงตรง backend ด้วย uid จาก JWT
  const token = cookieStore.get("mp_token")?.value || "";
  if (!token) throw new Error("unauthorized");

  const payload = decodeJwt<{ uid?: number }>(token);
  const uid = payload?.uid;
  if (!uid) throw new Error("unauthorized");

  const res2 = await fetch(`${env.API_BASE_URL}/users/${uid}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res2.ok) throw new Error("unauthorized");
  return (await res2.json()) as Profile;
}
