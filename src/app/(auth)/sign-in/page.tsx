// src/app/(auth)/sign-in/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SignInClient from "./signIn-client";

/**
 * ✅ Server Component — ทำหน้าที่ตรวจสอบ token เบื้องต้น
 * ------------------------------------------------------------
 * - ทำงานฝั่ง Server โดยตรง (ไม่ render ฝั่ง client)
 * - ป้องกันไม่ให้ผู้ใช้ที่ "ล็อกอินอยู่แล้ว" เข้าหน้า sign-in ได้
 * - ใช้ `cookies()` (Next.js built-in) เพื่ออ่านค่า cookie แบบ server-safe
 * - ถ้ามี token แล้ว และ API /api/auth/profile ตอบกลับว่า valid → redirect /dashboard
 * - ไม่อ่าน searchParams ฝั่ง server เพราะจะ trigger dynamic rendering
 */
export default async function SignInPage() {
  // อ่าน cookie mp_token ฝั่ง Server
  const cookieStore = await cookies();
  const token = cookieStore.get("mp_token")?.value;

  // ถ้ามี token → ตรวจสอบ profile กับ backend
  if (token) {
    // รองรับทั้ง dev, production, vercel preview
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    // ตรวจสอบว่า token ใช้ได้หรือไม่
    const res = await fetch(`${base}/api/auth/profile`, {
      cache: "no-store", // ห้าม cache profile
      headers: { cookie: `mp_token=${token}` },
    }).catch(() => null);

    // ถ้า profile ใช้ได้ → เด้งไป /dashboard
    if (res?.ok) redirect("/dashboard");
  }

  // ถ้าไม่ผ่าน → render client-side form
  return <SignInClient />;
}
