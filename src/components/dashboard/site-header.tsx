// src/components/dashboard/site-header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UploadSlipDialog } from "@/components/upload/UploadSlipDialog";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/transactions": "Transactions",
  "/dashboard/reports": "Reports",
};

export function SiteHeaderDashboard() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 h-6" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <UploadSlipDialog>
          <Button size="sm" className="bg-primary text-primary-foreground">
            Upload Slip
          </Button>
        </UploadSlipDialog>
      </div>
    </header>
  );
}
