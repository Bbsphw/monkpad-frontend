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

// ---- Types ----
type BaseItem = {
  title: string;
  icon?: LucideIcon;
};

type LinkItem = BaseItem & {
  kind: "link";
  url: string;
  /** exact match (default: false = startsWith) */
  exact?: boolean;
  /** next/link prefetch (default: false) */
  prefetch?: boolean;
  /** open new tab */
  external?: boolean;
};

type ActionItem = BaseItem & {
  kind: "action";
  action: "upload-slip";
  onSuccess?: () => void;
};

export type NavItem = LinkItem | ActionItem;

// ---- Component ----
export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const isActive = React.useCallback(
    (item: NavItem) => {
      if (item.kind !== "link") return false;
      const { url, exact } = item;
      if (exact) return pathname === url;
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

            // ----- Action item -----
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

            // ----- Link item -----
            const active = isActive(item);

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

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  data-active={active}
                >
                  <Link
                    href={item.url}
                    prefetch={item.prefetch ?? false} // ← default: false
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
