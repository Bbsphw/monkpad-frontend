// src/components/auth/auth-card.tsx

import { type ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";

/**
 * ประเภทของไอคอนที่ AuthCard รองรับ
 */
type AuthIcon = "login" | "signup";

/**
 * Props สำหรับ AuthCard
 * - title: หัวข้อหลักของการ์ด
 * - description: คำอธิบายสั้น ๆ ใต้หัวข้อ (optional)
 * - icon: เลือกไอคอน (login/signup)
 * - children: เนื้อหาภายใน เช่น ฟอร์ม Sign in / Sign up
 */
interface AuthCardProps {
  title: string;
  description?: string;
  icon?: AuthIcon;
  children: ReactNode;
}

/**
 * mapping icon type → lucide-react component
 * ✅ ใช้ Record เพื่อ type-safe และ scale ต่อได้ง่าย (เพิ่ม “forgot-password” ภายหลังได้)
 */
const iconMap: Record<AuthIcon, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  signup: UserPlus,
};

/**
 * 🔐 AuthCard
 * ใช้เป็น container มาตรฐานสำหรับหน้า Sign in / Sign up
 * รองรับ theme / responsive / reusability ในทุกหน้าที่เกี่ยวข้องกับ Auth
 */
export default function AuthCard({
  title,
  description,
  icon = "login", // default = login
  children,
}: AuthCardProps) {
  // เลือก component ไอคอนตาม prop (fallback = LogIn)
  const IconComp = iconMap[icon] ?? LogIn;

  return (
    <Card
      className="
        w-full max-w-md 
        shadow-strong 
        transition-shadow 
        duration-300 
        hover:shadow-lg 
        border-border
      "
    >
      <CardHeader className="text-center space-y-2">
        {/* วงกลมพื้นหลังของ icon */}
        <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
          <IconComp className="h-6 w-6 text-primary-foreground" />
        </div>

        {/* ชื่อการ์ด */}
        <CardTitle className="text-2xl font-bold tracking-tight">
          {title}
        </CardTitle>

        {/* คำอธิบาย (optional) */}
        {description ? (
          <CardDescription className="text-muted-foreground text-sm">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>

      {/* children: ส่วนของฟอร์ม Sign in / Sign up */}
      {children}
    </Card>
  );
}
