// src/components/dashboard/site-header.tsx

"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UploadSlipDialog } from "@/components/upload/UploadSlipDialog";
// ถ้าต้องการให้กดแล้วรีโหลดรายการธุรกรรมทันที ให้ใช้ context นี้ (ปิดไว้ก่อน)
// import { useTransactionsContext } from "@/app/(protected)/transactions/_components/transaction-filters";

/** mapping pathname → ชื่อหน้า บน header */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/reports": "Reports",
};

/** Header ด้านบนในหน้า protected: ปุ่มเปิด sidebar + ชื่อหน้า + ปุ่ม Upload Slip */
export function SiteHeaderDashboard() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  // ถ้าต้องการ reload หลังอัปโหลดสำเร็จ
  // const { reload } = useTransactionsContext();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      {/* ปุ่ม trigger เปิด/ปิด sidebar (จาก shadcn/ui sidebar) */}
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 h-6" />

      {/* ชื่อหน้าแบบไดนามิก */}
      <h1 className="text-lg font-semibold">{title}</h1>

      {/* ปุ่มขวาสุด: เปิด dialog อัปโหลดสลิป (option: onSuccess เรียก reload) */}
      <div className="ml-auto flex items-center gap-2">
        <UploadSlipDialog>
          {/* <UploadSlipDialog onSuccess={reload}> */}
          <Button size="sm" className="bg-primary text-primary-foreground">
            Upload Slip
          </Button>
        </UploadSlipDialog>
      </div>
    </header>
  );
}
