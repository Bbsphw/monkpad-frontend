// src/app/(protected)/reports/page.tsx

import { Suspense } from "react";
import ReportClient from "./_components/report-client";
import { ReportSkeleton } from "./_components/report-skeleton";

/**
 * 📄 ReportsPage
 * ──────────────────────────────────────────────
 * ✅ หน้ารวมรายงานภาพรวมของผู้ใช้ (รายรับ–รายจ่าย / หมวดหมู่ / แนวโน้ม)
 *
 * 🔧 Role:
 *   - เป็น Server Component (default ใน App Router)
 *   - ใช้ <Suspense> ครอบ ReportClient เพื่อแสดง skeleton ขณะโหลด
 *   - delegate การ fetch / render จริงให้ฝั่ง Client (ReportClient)
 *
 * ⚙️ Flow:
 *   1️⃣ โหลด ReportsPage (SSR)
 *   2️⃣ Render <ReportSkeleton> ทันที (fallback)
 *   3️⃣ Client component (ReportClient) จะเริ่มโหลดผ่าน dynamic import
 *   4️⃣ เมื่อโหลดเสร็จ → Suspense ปลด fallback แล้วแสดงข้อมูลจริง
 *
 * 🧩 Benefit:
 *   - UX ลื่นไม่กระตุก (แสดง placeholder ทันที)
 *   - ลด bundle size เพราะ ReportClient แยกโหลดเฉพาะ client
 *   - รองรับการทำ streaming SSR ของ Next.js
 */
export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      {/* ⚡ Client-side visualization + SWR fetcher */}
      <ReportClient />
    </Suspense>
  );
}
