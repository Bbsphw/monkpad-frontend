// src/app/(protected)/dashboard/page.tsx

import { Suspense } from "react";
import DashboardClient from "./_components/dashboard-client";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";

/**
 * 📘 DashboardPage (Server Component)
 * ───────────────────────────────────────────────
 * - หน้าแดชบอร์ดหลักของผู้ใช้ที่ล็อกอินแล้ว (อยู่ใต้ layout: (protected))
 * - ใช้แนวคิด “Hybrid Rendering” ของ Next.js:
 *   🔹 Server component = เปลือกหลัก (page.tsx)
 *   🔹 Client component = DashboardClient (โหลดข้อมูลผ่าน useSWR)
 *
 * ✅ ใช้ <Suspense> ครอบ เพื่อรองรับ:
 *   - การโหลด chunk ของ DashboardClient แบบ lazy
 *   - แสดง Skeleton UI (DashboardSkeleton) ระหว่าง fetcher กำลังทำงาน
 *
 * 💡 ข้อดีของการออกแบบแบบนี้:
 *   - ลด TTFB (time to first byte) ของ server-rendered shell
 *   - UI skeleton แสดงทันทีโดยไม่ต้องรอ JS bundle ของ client
 *   - DashboardClient จัดการข้อมูล/การโหลดผ่าน SWR แบบ reactive เอง
 */

export default function DashboardPage() {
  return (
    // Suspense boundary ช่วยให้ UI สามารถ “render บางส่วน” ก่อน
    <Suspense fallback={<DashboardSkeleton />}>
      {/* ✅ Client component (ใช้ useDashboard hook + lazy dynamic imports) */}
      <DashboardClient />
    </Suspense>
  );
}
