// src/app/(auth)/sign-up/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SignUpClient from "./signUp-client";

/**
 * Server: ถ้ามี token แล้ว และ profile ใช้ได้ → redirect /dashboard
 */
export default async function SignUpPage() {
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

  return <SignUpClient />;
}
