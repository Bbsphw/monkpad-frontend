// ─────────────────────────────────────────────────────────────
// FILE: components/dashboard/new/nav-main.tsx (CLIENT COMPONENT)
// Purpose: Main nav; accepts plain data and renders lucide icons safely.
// ─────────────────────────────────────────────────────────────
"use client";

import * as React from "react";
import Link from "next/link";
import { type LucideIcon, ImageUp } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UploadSlipDialog } from "@/components/upload/UploadSlipDialog";

export type NavItem = { title: string; url: string; icon?: LucideIcon };

export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;

            // เปิด Dialog แทนการเปลี่ยนหน้า
            if (item.url === "/dashboard/upload") {
              return (
                <SidebarMenuItem key={item.title}>
                  <UploadSlipDialog
                    onSuccess={() => {
                      /* refresh or toast */
                    }}
                  >
                    <SidebarMenuButton tooltip={item.title}>
                      {Icon ? <Icon /> : <ImageUp />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </UploadSlipDialog>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
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
