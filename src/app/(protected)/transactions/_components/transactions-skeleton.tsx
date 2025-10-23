// src/app/(protected)/transactions/_components/transactions-skeleton.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * TransactionsSkeleton
 * ---------------------
 * ใช้เป็น fallback UI ระหว่างรอ dynamic import หรือ data จาก SWR
 * แสดงโครง layout เหมือนหน้าจริง (Filters + Table)
 * เพื่อป้องกัน Layout Shift (CLS) และให้ผู้ใช้เห็นรูปแบบหน้าโดยทันที
 */
export default function TransactionsSkeleton() {
  return (
    <div className="space-y-4">
      {/* ───────── Filters row ─────────
       * grid layout จำลองโครงกรองข้อมูล + ปุ่ม Export
       * สัดส่วนและ spacing เท่าของจริง เพื่อให้ skeleton transition สมูท
       */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_180px_180px_auto] gap-3 w-full">
          {/* ช่องค้นหา */}
          <Skeleton className="h-9 w-full sm:col-span-2 lg:col-span-1" />
          {/* ประเภท / จากวัน / ถึงวัน */}
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          {/* ปุ่มรีเซ็ต */}
          <div className="flex lg:justify-end">
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* ปุ่ม Export ด้านขวา */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* ───────── Table skeleton ─────────
       * ใช้ Array(10) จำลองแถวของธุรกรรม
       * แต่ละ Skeleton สูงเท่ากับ <TableRow> จริง (~48px)
       */}
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
