// src/components/common/error-alert.tsx

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

/**
 * 🔔 ErrorAlert
 * กล่องแสดงข้อความผิดพลาด (Error Message / API Error / Validation)
 *
 * ✅ Features:
 * - สีพื้นหลังอิง theme (`destructive` จาก shadcn/ui)
 * - รองรับข้อความหลายบรรทัด
 * - สามารถปรับ className เพิ่มเติมได้
 * - มี role="alert" สำหรับ A11y (ให้ screen reader อ่านทันที)
 */
type Props = HTMLAttributes<HTMLDivElement>;

export default function ErrorAlert({ className, children, ...rest }: Props) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
      {...rest}
    >
      {/* ถ้ามีหลายบรรทัด children จะจัด spacing อัตโนมัติ */}
      <div className="flex-1 leading-snug">{children}</div>
    </div>
  );
}
