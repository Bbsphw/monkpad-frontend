// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn(): รวม className หลาย ๆ ค่าเข้าด้วยกัน
 * - ใช้ clsx เพื่อคำนวณเงื่อนไข
 * - ใช้ twMerge เพื่อแก้ class ที่ซ้ำ/ขัดแย้ง (เช่น px-2 vs px-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
