// src/app/(protected)/dashboard/_types/dashboard.ts

export type SummaryDTO = {
  income: number;
  expense: number;
  balance: number;
};

export type SummaryPayload = {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
};

export type CategoryRow = {
  category: string;
  expense: number;
};

/** ชุดรายเดือน (มาจาก /api/reports/monthly) */
export type TrafficPoint = {
  month: string; // e.g. "01/25"
  income: number;
  expense: number;
};

/** จุดข้อมูลสำหรับกราฟ Area ในแดชบอร์ด (แกน X ใช้ date ISO) */
export type TrafficAreaPoint = {
  date: string; // YYYY-MM-01
  income: number;
  expense: number;
};

export type RecentRow = {
  id: number | string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: "income" | "expense";
  tag?: string;
  category?: string;
  amount?: number;
  value?: number;
  note?: string;
};
