// src/app/(protected)/reports/_components/report-skeleton.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * 🔹 ReportSkeleton
 * ─────────────────────────────────────────────────────
 * Skeleton UI สำหรับหน้า `/reports`
 * ใช้ในช่วงที่ข้อมูลยังไม่ถูกโหลดจาก useReports (SWR)
 *
 * จุดประสงค์:
 *  - ป้องกัน layout shift ระหว่างโหลด
 *  - แสดง placeholder ที่มีขนาดเท่าจริงกับ UI ที่จะปรากฏภายหลัง
 *  - รองรับ responsive ทั้ง mobile และ desktop
 *
 * ใช้ร่วมกับ <Suspense> หรือ loading state ของ ReportClient
 */
export function ReportSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ─────────────── Header Placeholder ───────────────
          ส่วนหัวของหน้า เช่น title และคำอธิบายย่อย
          ใช้ Skeleton สองแท่งจำลองขนาดตัวอักษรที่ต่างกัน */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-[180px]" /> {/* title line */}
        <Skeleton className="h-4 w-[280px]" /> {/* subtitle line */}
      </div>

      {/* ─────────────── Summary Section ───────────────
          Layout 3 คอลัมน์ (บนจอใหญ่)
          - การ์ดสรุป (col-span-1)
          - กราฟรายเดือน (col-span-2)
          ใช้ขนาดเดียวกับ component จริง */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[180px] rounded-xl col-span-1" />
        <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
      </div>

      {/* ─────────────── Category Chart ───────────────
          แทนที่ตำแหน่งของ BarTrendChart จริง */}
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
