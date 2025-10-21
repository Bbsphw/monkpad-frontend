// src/app/(protected)/transactions/_schemas/transaction-schema.ts

import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(10, "โปรดเลือกวันที่ (YYYY-MM-DD)"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "เวลาไม่ถูกต้อง (HH:mm หรือ HH:mm:ss)")
    .optional(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "โปรดเลือกหมวด"),
  amount: z.coerce
    .number()
    .refine((v) => Number.isFinite(v), { message: "จำนวนเงินต้องเป็นตัวเลข" })
    .gt(0, { message: "จำนวนเงินต้องมากกว่า 0" }),
  note: z.string().max(300, "รายละเอียดต้องไม่เกิน 300 ตัวอักษร").optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
