// src/components/dashboard/app-sidebar.tsx

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

/** เมนูหลักของแอป (ฝั่งซ้าย) */
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
  // ตัวอย่าง action ที่เปิด dialog อัปโหลดสลิป (ปิดไว้ก่อน)
  // {
  //   kind: "action",
  //   title: "Upload Slip",
  //   action: "upload-slip",
  //   icon: ImageUp,
  // },
];

export type AppSidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

/** โครง Sidebar หลักของแอป: Header → โลโก้ → เมนู → Footer (ข้อมูลผู้ใช้) */
export function AppSidebar({ user }: { user: AppSidebarUser }) {
  return (
    <Sidebar>
      {/* เผื่อเงื่อนไข/ช่องว่างด้านบนของ sidebar */}
      <SidebarHeader />

      {/* แถบโลโก้: ใช้ SiteLogo แต่ห่อด้วย Link เอง เพื่อเลี่ยง <a> ซ้อนกัน */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="data-[slot=sidebar-menu-button]:!rounded-full justify-center"
          >
            {/* ให้ SiteLogo ไม่สร้าง <a> เอง โดยส่ง href={null} */}
            <Link href="/dashboard" className="inline-flex items-center">
              <SiteLogo href={null} />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* เนื้อหาเมนูหลัก */}
      <SidebarContent>
        <SidebarGroup>
          <NavMain items={navMain} />
        </SidebarGroup>
      </SidebarContent>

      {/* ส่วนท้าย: โปรไฟล์/เมนูผู้ใช้ */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
