// src/components/dashboard/new/app-sidebar.tsx
"use client";

import Link from "next/link";
import SiteLogo from "@/components/site/site-logo";
import { NavUser } from "./nav-user";
import { NavMain, type NavItem } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BadgeDollarSign,
  ChartBar,
  ImageUp,
  LayoutDashboard,
} from "lucide-react";

const navMain: NavItem[] = [
  {
    kind: "link",
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    kind: "link",
    title: "Transactions",
    url: "/transactions",
    icon: BadgeDollarSign,
  },
  { kind: "link", title: "Reports", url: "/reports", icon: ChartBar },
  {
    kind: "action",
    title: "Upload Slip",
    action: "upload-slip",
    icon: ImageUp,
  },
];

export type AppSidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

export function AppSidebar({ user }: { user: AppSidebarUser }) {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="data-[slot=sidebar-menu-button]:!rounded-full justify-center"
          >
            {/* ห่อ Link ชั้นเดียว และให้ SiteLogo ไม่สร้าง <a> อีก */}
            <Link href="/dashboard" className="inline-flex items-center">
              <SiteLogo href={null} />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarContent>
        <SidebarGroup>
          <NavMain items={navMain} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
