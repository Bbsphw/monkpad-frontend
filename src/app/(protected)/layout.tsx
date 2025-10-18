// // src/app/(protected)/layout.tsx

// import { ReactNode } from "react";
// import { AppSidebar } from "@/components/dashboard/app-sidebar";
// import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import { SiteHeaderDashboard } from "@/components/dashboard/site-header";

// export default function ProtectedLayout({ children }: { children: ReactNode }) {
//   return (
//     <SidebarProvider
//       style={
//         {
//           "--sidebar-width": "calc(var(--spacing) * 72)",
//           "--header-height": "calc(var(--spacing) * 12)",
//         } as React.CSSProperties
//       }
//     >
//       <AppSidebar />
//       <SidebarInset>
//         <SiteHeaderDashboard />
//         <main className="flex flex-1 flex-col p-4 md:p-6 gap-6">
//           {children}
//         </main>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }

// // src/app/(protected)/layout.tsx
// import { ReactNode } from "react";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";

// import { AppSidebar } from "@/components/dashboard/app-sidebar";
// import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import { SiteHeaderDashboard } from "@/components/dashboard/site-header";
// import { env } from "@/lib/env"; // ✅ ใช้ URL back-end โดยตรง

// type Profile = { id: number; username: string; email: string };

// function avatarFrom(username: string) {
//   const seed = encodeURIComponent(username || "user");
//   return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
// }

// export default async function ProtectedLayout({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   // 1) ต้องมี mp_token
//   const cookieStore = await cookies();
//   const token = cookieStore.get("mp_token")?.value;
//   if (!token) {
//     redirect("/sign-in?next=/dashboard");
//   }

//   // 2) เรียก BACKEND ตรง ๆ (ไม่ผ่าน /api/auth/profile เพื่อเลี่ยงปัญหา header/cookies context)
//   let profile: Profile | null = null;
//   try {
//     const res = await fetch(`${env.API_BASE_URL}/users/me`, {
//       method: "GET",
//       cache: "no-store",
//       headers: {
//         Authorization: `Bearer ${token}`, // ✅ ส่ง JWT ตรง ๆ
//         Accept: "application/json",
//       },
//     });

//     if (!res.ok) {
//       // 401/403/422 = token ใช้ไม่ได้ → กลับหน้า sign-in
//       redirect("/sign-in?next=/dashboard");
//     }

//     profile = (await res.json()) as Profile;
//   } catch {
//     // fetch ล้ม (เน็ต/URL ผิด) → ป้องกันด้วย redirect
//     redirect("/sign-in?next=/dashboard");
//   }

//   const user = {
//     name: profile!.username,
//     email: profile!.email,
//     avatar: avatarFrom(profile!.username),
//   };

//   return (
//     <SidebarProvider
//       style={
//         {
//           "--sidebar-width": "calc(var(--spacing) * 72)",
//           "--header-height": "calc(var(--spacing) * 12)",
//         } as React.CSSProperties
//       }
//     >
//       <AppSidebar user={user} />
//       <SidebarInset>
//         <SiteHeaderDashboard />
//         <main className="flex flex-1 flex-col p-4 md:p-6 gap-6">
//           {children}
//         </main>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }

// src/app/(protected)/layout.tsx
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeaderDashboard } from "@/components/dashboard/site-header";
import { env } from "@/lib/env";

type Profile = { id: number; username: string; email: string };

// ถอด avatar initials
function avatarFrom(username: string) {
  const seed = encodeURIComponent(username || "user");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

// ถอด JWT payload แบบไม่ verify (พอใช้เพื่ออ่าน uid/sub)
function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    // base64url → base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1) ต้องมี mp_token
  const cookieStore = await cookies();
  const token = cookieStore.get("mp_token")?.value;
  if (!token) redirect("/sign-in?next=/dashboard");

  // 2) ถอด uid จาก JWT (payload คาดว่า { sub: string, uid: number })
  const payload = decodeJwt<{ sub?: string; uid?: number }>(token);
  const uid = payload?.uid;
  if (!uid) {
    // token ไม่มี uid → ถือว่าใช้ไม่ได้
    redirect("/sign-in?next=/dashboard");
  }

  // 3) เรียกโปรไฟล์ด้วย /users/{uid} แทน /users/me (บางระบบ /me ตอบ 422)
  let profile: Profile | null = null;
  try {
    const res = await fetch(`${env.API_BASE_URL}/users/${uid}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      // 401/403/404/422 → กลับหน้า sign-in
      redirect("/sign-in?next=/dashboard");
    }

    profile = (await res.json()) as Profile;
  } catch {
    redirect("/sign-in?next=/dashboard");
  }

  const user = {
    name: profile!.username,
    email: profile!.email,
    avatar: avatarFrom(profile!.username),
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeaderDashboard />
        <main className="flex flex-1 flex-col p-4 md:p-6 gap-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
