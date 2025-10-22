// src/components/dashboard/nav-user.tsx

"use client";

import {
  CreditCard,
  EllipsisVertical,
  LogOut,
  BellRing,
  UserCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { ChangePasswordDialog } from "@/components/account/change-password-dialog";
import { ChangeEmailDialog } from "@/components/account/change-email-dialog";
import { ChangeUsernameDialog } from "@/components/account/change-username-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** เมนูผู้ใช้ที่ footer ของ Sidebar: โปรไฟล์ + เมนูแก้ไขบัญชี + ออกจากระบบ */
export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  /** ออกจากระบบ: เรียก API แล้ว redirect ไปหน้า sign-in */
  const onLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "GET" });
      if (!res.ok) throw new Error();
      toast.success("ออกจากระบบสำเร็จ");
      router.replace("/sign-in");
    } catch {
      toast.error("ออกจากระบบไม่สำเร็จ");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {/* ปุ่มกดด้านขวาล่างของ sidebar แสดงชื่อ/อีเมลและไอคอน ... */}
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.slice(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* เนื้อหาเมนูดรอปดาวน์: ปรับตำแหน่งตาม isMobile */}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* ส่วนหัว: แสดง avatar + ชื่อ + อีเมล อีกครั้ง */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.slice(0, 2).toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* กลุ่มเมนูแก้ไขข้อมูลบัญชี (เปิด Dialog แบบ asChild) */}
            <DropdownMenuGroup>
              <ChangeUsernameDialog
                asChild
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserCircle />
                    เปลี่ยนชื่อผู้ใช้
                  </DropdownMenuItem>
                }
              />
              <ChangeEmailDialog
                asChild
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <CreditCard />
                    เปลี่ยนอีเมล
                  </DropdownMenuItem>
                }
              />
              <ChangePasswordDialog
                asChild
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <BellRing />
                    เปลี่ยนรหัสผ่าน
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* ออกจากระบบ */}
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
