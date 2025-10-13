// app/(protected)/transactions/_schemas/transaction-schema.ts
import { z } from "zod";

/**
 * สคีมา: ใช้ z.coerce.number() เพื่อให้ amount ออกมาเป็น number เสมอ
 * เรียง .max().optional() ให้ถูกต้อง
 */
export const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(10, "โปรดเลือกวันที่"),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string().min(1, "โปรดเลือกหมวดหมู่"),

  amount: z.coerce
    .number()
    .refine((v) => !Number.isNaN(v), { message: "จำนวนเงินต้องเป็นตัวเลข" })
    .gt(0, { message: "จำนวนเงินต้องมากกว่า 0" }),

  note: z.string().max(300, "โน้ตยาวเกินไป").optional(),

  status: z.enum(["draft", "posted", "void"]).default("posted"),
  source: z.enum(["manual", "ocr"]).default("manual"),
});

/**
 * ฟอร์มของเรา “ต้องการใช้จริง” เป็น number แล้ว (หลัง coerce)
 * นิยามเป็น type ตายตัว เพื่อให้ useForm<T> และ zodResolver<T> ตรงกัน 100%
 */
export type TransactionFormValues = {
  id?: string;
  date: string;
  type: "income" | "expense" | "transfer";
  category: string;
  amount: number;
  note?: string;
  status: "draft" | "posted" | "void";
  source: "manual" | "ocr";
};
