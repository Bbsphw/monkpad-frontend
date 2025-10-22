// src/app/(protected)/layout.tsx

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SWRConfig } from "swr";
import { getProfile } from "@/lib/auth-client";
import { AppSidebar } from "@/components/navbar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeaderDashboard } from "@/components/navbar/site-header";

/**
 * avatarFrom
 * ----------
 * ยูทิลเล็ก ๆ สำหรับสร้าง URL รูป avatar (placeholder) จาก username
 * - ใช้ dicebear initials → ไม่ต้องเก็บไฟล์รูป
 * - encodeURIComponent เผื่อมีอักขระพิเศษ
 */
function avatarFrom(username: string) {
  const seed = encodeURIComponent(username || "user");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

/**
 * ProtectedLayout (Server Component)
 * ----------------------------------
 * หน้าครอบทุกเพจในโซน (protected)
 *
 * Responsibilities:
 * 1) ตรวจ auth ฝั่ง server ตั้งแต่ชั้น layout → ป้องกันการ flash/แอบเห็น UI
 * 2) ตั้งค่า SWR (global) ให้ทุก client component ใช้ค่ามาตรฐานเดียวกัน
 * 3) จัดวาง Shell หลัก (Sidebar + Header + main) ด้วย SidebarProvider
 *
 * Notes:
 * - ใช้ server component เพื่อให้ redirect ทำงานแบบ HTTP-first บน Edge/Node
 * - ถ้า getProfile() ล้มเหลว → redirect ไป /sign-in พร้อม next=/dashboard
 * - เลือก set keepPreviousData เพื่อให้ผิว UI ลื่นเมื่อเปลี่ยน key ของ SWR
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  let profile;
  try {
    // 🔒 Server-side guard: ถ้าหา profile ไม่เจอ/หมดอายุ → throw และ redirect
    profile = await getProfile();
  } catch {
    // ❗️สำคัญ: redirect ใน server จะ short-circuit การเรนเดอร์ → ไม่เกิด flash
    redirect("/sign-in?next=/dashboard");
  }

  // 🧑‍💼 map ข้อมูล user สำหรับ Sidebar/Nav (ไม่ต้องส่ง token ออก client)
  const user = {
    name: profile.username,
    email: profile.email,
    avatar: avatarFrom(profile.username),
  };

  return (
    // 🌐 Global SWR config: ควบคุมพฤติกรรม fetch ของทุก useSWR() ใต้ layout นี้
    <SWRConfig
      value={{
        // ลดการยิงซ้ำใน dev/strict mode และช่วงสลับ tab
        dedupingInterval: 5000,
        // UX: ไม่ revalidate อัตโนมัติเมื่อโฟกัสหน้าต่าง/เน็ตต่อใหม่ (เราควบคุมเอง)
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        // UX: คงค่าเดิมไว้ระหว่างกำลังโหลดข้อมูลใหม่ → ลดจังหวะ “กะพริบ”
        keepPreviousData: true,
      }}
    >
      {/* 🧱 Shell Provider: ให้คอมโพเนนต์ sidebar อ่าน/ควบคุมสถานะเปิด-ปิดได้ */}
      <SidebarProvider
        // 🎨 ส่ง CSS variables แบบ inline เพื่อปรับ layout ได้กลางระบบ
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)", // ~ กว้าง ~18rem ถ้าค่า spacing = 4px
            "--header-height": "calc(var(--spacing) * 12)", // ~ สูง ~3rem
          } as React.CSSProperties
        }
      >
        {/* 🧭 ซ้าย: App Sidebar (รับ user object เพื่อแสดงโปรไฟล์/เมนู) */}
        <AppSidebar user={user} />

        {/* 📐 ขวา: เนื้อหา + Header */}
        <SidebarInset>
          {/* 🔝 Header ส่วนบนของทุกหน้าภายใต้ protected (มีปุ่ม upload, ชื่อหน้า, ฯลฯ) */}
          <SiteHeaderDashboard />

          {/* 📄 พื้นที่เนื้อหาเพจย่อย (children) */}
          <main
            className="flex flex-1 flex-col p-4 md:p-6 gap-6"
            // a11y: landmark region สำหรับ content หลัก
            role="main"
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SWRConfig>
  );
}
