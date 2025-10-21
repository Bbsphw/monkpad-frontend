// src/app/(protected)/reports/_schemas/reports-schema.ts

import { z } from "zod";

export const ReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  type: z.enum(["income", "expense", "all"]).default("expense"),
});
export type ReportQuery = z.infer<typeof ReportQuerySchema>;

export const TransactionSchema = z.object({
  id: z.number().int(),
  tag_id: z.number().int(),
  value: z.number(),
  date: z.string(), // assume backend validated
  time: z.string(),
  type: z.enum(["income", "expense"]),
  tag: z.string(),
  note: z.string().optional(),
});
export const TransactionListSchema = z.array(TransactionSchema);

export const CategoryRowSchema = z.object({
  category: z.string(),
  expense: z.number().nonnegative(),
});
export const CategoryListSchema = z.array(CategoryRowSchema);

export const ApiPayloadSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    transactions: TransactionListSchema.default([]),
    categories: CategoryListSchema.default([]),
  }),
});
export type ApiPayload = z.infer<typeof ApiPayloadSchema>;
