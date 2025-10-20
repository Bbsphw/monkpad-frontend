// src/app/(protected)/dashboard/_schemas/dashboard.ts

import { z } from "zod";

export const DashboardSummarySchema = z.object({
  income: z.number().nonnegative(),
  expense: z.number().nonnegative(),
  balance: z.number(), // อาจติดลบได้
  txCount: z.number().int().nonnegative(),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

export const CategoryRowSchema = z.object({
  category: z.string(),
  value: z.number().nonnegative(),
});
export const CategoryListSchema = z.array(CategoryRowSchema);

export const RecentTxRowSchema = z.object({
  id: z.union([z.string(), z.number()]),
  date: z.string(), // สมมติ API ฝั่งเรา validate แล้ว
  type: z.enum(["income", "expense"]),
  category: z.string(),
  amount: z.number(),
  note: z.string().optional(),
});
export const RecentTxListSchema = z.array(RecentTxRowSchema);

export const TrafficPointSchema = z.object({
  date: z.string(),
  income: z.number().nonnegative(),
  expense: z.number().nonnegative(),
});
export const TrafficSeriesSchema = z.array(TrafficPointSchema);
