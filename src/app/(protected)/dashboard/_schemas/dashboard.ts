// src/app/(protected)/dashboard/_schemas/dashboard.ts

import { z } from "zod";

/* ───────────────────────────── DashboardSummarySchema ─────────────────────────────
 * 🎯 สรุปตัวเลขภาพรวมของแดชบอร์ดในเดือนปัจจุบัน
 *  - income  : ยอดรายรับรวมทั้งหมด
 *  - expense : ยอดรายจ่ายรวมทั้งหมด
 *  - balance : ยอดคงเหลือ (income - expense) — อาจติดลบได้
 *  - txCount : จำนวนธุรกรรมในเดือนนั้น (ใช้เพื่อเทียบกับการเติบโต)
 *
 * ✅ ใช้ validate ทั้งฝั่ง API (server response) และฝั่ง client state
 */
export const DashboardSummarySchema = z.object({
  income: z.number().nonnegative(), // ต้องเป็นจำนวน ≥ 0
  expense: z.number().nonnegative(),
  balance: z.number(), // สามารถติดลบได้ (เช่น รายจ่ายมากกว่ารายรับ)
  txCount: z.number().int().nonnegative(), // จำนวนธุรกรรมต้องเป็นจำนวนเต็ม ≥ 0
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

/* ───────────────────────────── CategoryRowSchema ─────────────────────────────
 * 📊 ใช้ในหมวดหมู่รายจ่าย/รายรับ (โดนัทกราฟ)
 *  - category : ชื่อหมวดหมู่ (เช่น อาหาร, เดินทาง)
 *  - value    : จำนวนเงินรวมของหมวดนั้น
 */
export const CategoryRowSchema = z.object({
  category: z.string(),
  value: z.number().nonnegative(),
});

/** รายการหมวดหมู่ทั้งหมด */
export const CategoryListSchema = z.array(CategoryRowSchema);

/* ───────────────────────────── RecentTxRowSchema ─────────────────────────────
 * 🧾 ธุรกรรมล่าสุด (ใช้ในตาราง RecentTransactions)
 *  - id        : รหัสธุรกรรม (string หรือ number ตาม backend)
 *  - date      : วันที่ในรูปแบบ ISO string (validate ฝั่ง API แล้ว)
 *  - type      : ประเภท ("income" | "expense")
 *  - category  : หมวดหมู่หลักของธุรกรรม
 *  - amount    : จำนวนเงิน (บวกเสมอ, ส่วนเครื่องหมายถูกแสดงตาม type)
 *  - note      : (optional) รายละเอียดเพิ่มเติม
 *
 * ✅ zod.validate ใช้ตรวจโครงสร้าง API ก่อนส่งให้ UI
 */
export const RecentTxRowSchema = z.object({
  id: z.union([z.string(), z.number()]), // รองรับ id ทั้งสองรูปแบบ
  date: z.string(), // สมมติว่า API ตรวจสอบ ISO แล้ว
  type: z.enum(["income", "expense"]),
  category: z.string(),
  amount: z.number(),
  note: z.string().optional(),
});

/** รายการธุรกรรมล่าสุดแบบ array */
export const RecentTxListSchema = z.array(RecentTxRowSchema);

/* ───────────────────────────── TrafficPointSchema ─────────────────────────────
 * 📈 จุดข้อมูลแนวโน้มรายเดือน (ใช้กับกราฟเส้น/พื้นที่)
 *  - date    : รูปแบบ YYYY-MM-DD (ใช้ day 01 สำหรับสรุปรายเดือน)
 *  - income  : ยอดรวมรายรับของเดือนนั้น
 *  - expense : ยอดรวมรายจ่ายของเดือนนั้น
 */
export const TrafficPointSchema = z.object({
  date: z.string(),
  income: z.number().nonnegative(),
  expense: z.number().nonnegative(),
});

/** ชุดข้อมูลแนวโน้มทั้งปี (array ของ TrafficPoint) */
export const TrafficSeriesSchema = z.array(TrafficPointSchema);
