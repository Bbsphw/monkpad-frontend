// src/components/dashboard/nav-main.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon, ImageUp } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UploadSlipDialog } from "@/components/upload/UploadSlipDialog";

/* ---------- Types ---------- */
type BaseItem = {
  title: string;
  icon?: LucideIcon;
};

type LinkItem = BaseItem & {
  kind: "link";
  url: string;
  /** ต้องตรงเป๊ะหรือเริ่มต้นด้วยเส้นทาง (default: startsWith) */
  exact?: boolean;
  /** next/link prefetch (default: false เพื่อควบคุมแบนด์วิดท์) */
  prefetch?: boolean;
  /** เปิดแท็บใหม่/ภายนอก */
  external?: boolean;
};

type ActionItem = BaseItem & {
  kind: "action";
  action: "upload-slip";
  onSuccess?: () => void;
};

export type NavItem = LinkItem | ActionItem;

/** เมนูหลักภายใน Sidebar: รองรับทั้งลิงก์และ action (เช่น เปิดอัปโหลดสลิป) */
export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  /** ตรวจ active state ของลิงก์จาก pathname ปัจจุบัน */
  const isActive = React.useCallback(
    (item: NavItem) => {
      if (item.kind !== "link") return false;
      const { url, exact } = item;
      if (exact) return pathname === url;
      // active เมื่ออยู่ที่ path เดียวกันหรืออยู่ใต้ path นั้น
      return pathname === url || pathname.startsWith(url + "/");
    },
    [pathname]
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;

            /* ---------- Action item (เช่น เปิด dialog) ---------- */
            if (item.kind === "action") {
              return (
                <SidebarMenuItem key={item.title}>
                  <UploadSlipDialog onSuccess={item.onSuccess}>
                    <SidebarMenuButton tooltip={item.title}>
                      {Icon ? <Icon /> : <ImageUp />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </UploadSlipDialog>
                </SidebarMenuItem>
              );
            }

            /* ---------- Link item ---------- */
            const active = isActive(item);

            // ลิงก์ภายนอก: ใช้ <a> ปกติ + target=_blank
            if (item.external) {
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    data-active={active}
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener"
                      aria-current={active ? "page" : undefined}
                    >
                      {Icon ? <Icon /> : null}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            // ลิงก์ภายใน: next/link + aria-current เพื่อ A11y
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  data-active={active}
                >
                  <Link
                    href={item.url}
                    prefetch={item.prefetch ?? false} // ปิด prefetch โดยดีฟอลต์
                    aria-current={active ? "page" : undefined}
                  >
                    {Icon ? <Icon /> : null}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
