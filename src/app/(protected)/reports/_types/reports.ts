// src/app/(protected)/reports/_types/reports.ts

// รวบรวม type ที่ใช้ทั้งหน้า /reports

export type TxType = "income" | "expense";

export type Transaction = {
  id: number;
  tag_id: number;
  value: number; // จำนวนเงินจาก backend
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM:SS" หรือ "HH:MM"
  type: TxType; // จาก join tags.type
  tag: string; // ชื่อหมวด (tags.tag)
  note?: string;
};

export type CategoryRow = { category: string; expense: number };

export type MonthlyPoint = {
  month: string; // "MM/YY"
  income: number;
  expense: number;
};

export type Summary = {
  income: number;
  expense: number;
  balance: number;
  transactions: number; // จำนวน transaction ทั้งหมดในช่วงสcope (ที่เราใช้มาคิด)
};

export type ReportData = {
  summary: Summary;
  categorySeries: CategoryRow[]; // ใช้กับ BarTrendChart
  monthlySeries: MonthlyPoint[]; // ใช้กับ ColumnBarChart
};
