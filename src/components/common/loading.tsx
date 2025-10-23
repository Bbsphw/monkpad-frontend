// src/components/common/loading.tsx

"use client";

import { Loader2 } from "lucide-react";

/**
 * ขนาดของ Loading Spinner
 * - sm = ขนาดเล็ก เช่น ในปุ่ม
 * - md = ปกติ (ค่าเริ่มต้น)
 * - lg = ใช้ใน section หรือ card ใหญ่
 */
type LoadingSize = "sm" | "md" | "lg";

export interface LoadingProps {
  /** ขนาดของ spinner */
  size?: LoadingSize;
  /** ข้อความที่ต้องการแสดงถัดจาก spinner (เช่น “กำลังโหลด...”) */
  text?: string;
}

/** Mapping ขนาด → className ของ Tailwind */
const sizeMap: Record<LoadingSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

/**
 * 🔄 Loading Component
 * ใช้แสดงสถานะโหลดแบบมาตรฐานทั่วทั้งระบบ
 *
 * ✅ Features:
 * - ใช้ Lucide `Loader2` ที่สไตล์ minimal + responsive
 * - รองรับข้อความ (text) เสริม
 * - ปรับขนาดได้ 3 ระดับ (sm, md, lg)
 * - รองรับ Dark mode โดยใช้ `text-muted-foreground`
 */
export function Loading({ size = "md", text }: LoadingProps) {
  return (
    <div
      className="flex items-center gap-2 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={`${sizeMap[size]} animate-spin text-current`}
        aria-hidden="true"
      />
      {text && (
        <span className="text-sm font-medium tracking-tight">{text}</span>
      )}
    </div>
  );
}
