// src/app/(protected)/transactions/_schemas/transaction-schema.ts

import { z } from "zod";

/**
 * transactionSchema
 * ------------------
 * ใช้สำหรับ validate ฟอร์มธุรกรรม (ทั้ง income / expense)
 * รองรับทั้ง client validation (react-hook-form) และ server-side validation (API route)
 *
 * จุดเด่น:
 * - ใช้ .coerce.number() → รองรับ input string เช่น "1,000" หรือ "100.50"
 * - มีข้อความ error ภาษาไทยสำหรับทุก field
 * - ปลอดภัย: จำกัดค่า min/max / pattern สำหรับเวลาและข้อความ
 */

export const transactionSchema = z.object({
  // optional id → เฉพาะกรณี edit เท่านั้น
  id: z.string().optional(),

  // วันที่บังคับต้องกรอก และยาวอย่างน้อย 10 ตัวอักษร ("YYYY-MM-DD")
  date: z.string().min(10, "โปรดเลือกวันที่ (YYYY-MM-DD)"),

  // เวลา: ตรวจด้วย regex ว่าต้องเป็น HH:mm หรือ HH:mm:ss
  time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "เวลาไม่ถูกต้อง (HH:mm หรือ HH:mm:ss)")
    .optional(),

  // ประเภทธุรกรรม: จำกัดเป็น 2 ค่าเท่านั้น
  type: z.enum(["income", "expense"] as const),

  // หมวดหมู่: ต้องมีอย่างน้อย 1 ตัวอักษร
  category: z.string().min(1, "โปรดเลือกหมวด"),

  // จำนวนเงิน: แปลงจาก string → number, ต้องเป็นตัวเลข > 0
  amount: z.coerce
    .number()
    .refine((v) => Number.isFinite(v), {
      message: "จำนวนเงินต้องเป็นตัวเลข",
    })
    .gt(0, { message: "จำนวนเงินต้องมากกว่า 0" }),

  // รายละเอียด (note): ไม่บังคับ แต่จำกัดความยาวสูงสุด 300 ตัวอักษร
  note: z.string().max(300, "รายละเอียดต้องไม่เกิน 300 ตัวอักษร").optional(),
});

/**
 * TransactionFormValues
 * ---------------------
 * Type ที่ derive จาก schema นี้ ใช้กับ React Hook Form โดยตรง
 * → ช่วยให้ TypeScript ตรวจจับ field ผิดพลาดในฟอร์มได้ทันที
 */
export type TransactionFormValues = z.infer<typeof transactionSchema>;
