// src/app/(auth)/sign-in/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SignInClient from "./signIn-client";

/**
 * Server: ตรวจ token อย่างเดียว → ถ้าพบและ profile ใช้ได้ → redirect /dashboard
 * ไม่อ่าน searchParams ฝั่ง server (เลี่ยง dynamic API warning)
 */
export default async function SignInPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mp_token")?.value;

  if (token) {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(`${base}/api/auth/profile`, {
      cache: "no-store",
      headers: { cookie: `mp_token=${token}` },
    }).catch(() => null);

    if (res?.ok) {
      redirect("/dashboard");
    }
  }

  return <SignInClient />;
}
