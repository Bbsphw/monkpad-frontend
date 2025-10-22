// app/(protected)/transactions/_components/transactions-client.tsx

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/* ───────────────── Local skeletons (ใช้ตอน dynamic import ยังไม่เสร็จ) ─────────────────
 * ทำ skeleton แยกเป็นชิ้น ๆ เพื่อให้ layout คงที่ และให้ผู้ใช้เห็นโครงหน้าจอทันที
 * ข้อดี: ลด CLS (layout shift) และให้ feedback ระหว่างโหลด client bundles
 */
function FiltersSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_180px_180px_auto] gap-3 items-end">
      <Skeleton className="h-9 w-full sm:col-span-2 lg:col-span-1" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <div className="flex lg:justify-end">
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
function ExportBtnSkeleton() {
  return <Skeleton className="h-9 w-28" />;
}
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
function ActionSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9" />
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

/* ───────────────── Dynamic imports ─────────────────
 * แยกโค้ดเป็น chunk ตามหน้าที่ (Provider/Filters/Table/Export…)
 * - ssr: false เพราะทั้งหมดเป็น client-side interactive UI
 * - loading: ใส่ skeleton ตรงกับ component นั้น ๆ ให้ UX สมูท
 * หมายเหตุ: TransactionsProvider ไม่ต้องโชว์ skeleton ก็ได้เพราะมันเป็น wrapper logic
 */
const TransactionsProvider = dynamic(
  () => import("./transaction-filters").then((m) => m.TransactionsProvider),
  { ssr: false, loading: () => <></> }
);
const TransactionFilters = dynamic(
  () => import("./transaction-filters").then((m) => m.default),
  { ssr: false, loading: () => <FiltersSkeleton /> }
);
const TransactionTable = dynamic(
  () => import("./transaction-table").then((m) => m.default),
  { ssr: false, loading: () => <TableSkeleton /> }
);
const TransactionExportDialog = dynamic(
  () => import("./transaction-export-dialog").then((m) => m.default),
  { ssr: false, loading: () => <ExportBtnSkeleton /> }
);
/* หมายเหตุ: ไฟล์นี้ไม่ได้ render TransactionDeleteDialog โดยตรง
 * แต่แยก lazy ไว้ได้ในจุดที่เรียกใช้จริง (ภายในตาราง) เพื่อไม่ block first paint
 */
const TransactionDeleteDialog = dynamic(
  () => import("./transaction-delete-dialog"),
  { ssr: false, loading: () => <ActionSkeleton /> }
);

export default function TransactionsClient() {
  /* โครงสร้างหน้า:
   * - Provider ครอบทั้งหน้า → ให้ลูก ๆ เข้าถึง state/hook ได้จาก context
   * - Header ให้ข้อมูลบริบท + Title
   * - แถว Filters + ปุ่ม Export วางบนสุด เพื่อให้ผู้ใช้ปรับเงื่อนไขก่อน
   * - ตารางหลัก (มีสถานะโหลด/ว่างในตัวมันเองอยู่แล้ว)
   */
  return (
    <TransactionsProvider>
      <div className="space-y-4">
        {/* Header: semantics + ข้อความบรรยายช่วย SEO/A11y */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <h1 className="text-xl md:text-2xl font-semibold">
              รายการธุรกรรมล่าสุด
            </h1>
            <p className="text-sm text-muted-foreground">
              กรอง & ส่งออกข้อมูลได้ตามช่วงเวลา
            </p>
          </div>
        </header>

        {/* แถวควบคุม: แยก filters กับ action ด้านขวาเพื่อให้สแกนง่ายบนจอใหญ่
         * บนจอเล็กจะ wrap ลงบรรทัดถัดไปอัตโนมัติ (flex-wrap)
         */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <TransactionFilters />
          <div className="flex gap-2">
            {/* Export ใช้ dialog แยก: ลดโค้ดในหน้า และชัดเจนเรื่องภารกิจ */}
            <TransactionExportDialog />
          </div>
        </div>

        {/* ตารางหลัก: แยก concerns เรื่องโหลด/ว่างใน component นั้น ๆ (cohesion ดี) */}
        <TransactionTable />
      </div>
    </TransactionsProvider>
  );
}
