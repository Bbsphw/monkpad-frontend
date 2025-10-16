import type { ReportData } from "../_hooks/use-reports";

export async function getReport(_p: {
  mode: "MONTH" | "RANGE";
  year: number;
  month: number;
  type: "all" | "income" | "expense";
  rangeStart?: { year: number; month: number };
  rangeEnd?: { year: number; month: number };
}): Promise<ReportData | null> {
  // MOCK-ONLY: ยังไม่เชื่อม API คืน null เพื่อให้ use-reports ใช้ mockReport()
  return null;
}
