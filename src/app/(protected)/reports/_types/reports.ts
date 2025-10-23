// src/app/(protected)/reports/_types/reports.ts

// ──────────────────────────────────────────────
// 🔹 Overview:
//   ใช้รวม TypeScript type ทั้งหมดที่เกี่ยวข้องกับหน้า /reports
//   เพื่อให้ทุกส่วน (service, hook, component) ใช้ type เดียวกัน
//
//   โครงสร้างแบ่งเป็น 3 กลุ่มใหญ่:
//   1️⃣ Primitive models (TxType, Transaction)
//   2️⃣ Derived models (CategoryRow, MonthlyPoint, Summary)
//   3️⃣ Aggregated view model (ReportData)
// ──────────────────────────────────────────────

/** ประเภทธุรกรรมหลัก */
export type TxType = "income" | "expense";

/**
 * รายการธุรกรรม (Transaction)
 * ──────────────────────────────
 * - ข้อมูลที่ backend ส่งมาใน field data.transactions
 * - เป็น raw data ก่อนการ aggregate
 * - ใช้ derive สรุปทั้ง summary / monthly / category
 */
export type Transaction = {
  /** รหัสธุรกรรม (primary key ฝั่ง backend) */
  id: number;

  /** รหัส tag/category ที่เชื่อมโยง (foreign key) */
  tag_id: number;

  /** จำนวนเงินจาก backend (อาจบวกหรือลบขึ้นกับ type) */
  value: number;

  /** วันที่ของธุรกรรม เช่น "2025-10-22" */
  date: string;

  /** เวลา เช่น "13:45" หรือ "13:45:00" */
  time: string;

  /** ประเภทธุรกรรม (รายรับหรือรายจ่าย) */
  type: TxType;

  /** ชื่อหมวด (มาจากตาราง tags หรือ join กับ tag_id) */
  tag: string;

  /** หมายเหตุเพิ่มเติมของธุรกรรม (optional) */
  note?: string;
};

/**
 * แถวข้อมูลของหมวดหมู่ (CategoryRow)
 * ──────────────────────────────
 * ใช้กับกราฟ BarTrendChart เพื่อวิเคราะห์รายจ่ายตามหมวด
 */
export type CategoryRow = {
  /** ชื่อหมวด เช่น “อาหาร”, “เดินทาง”, “ค่าบ้าน” */
  category: string;

  /** ยอดรวมรายจ่ายในหมวดนั้น (≥ 0) */
  expense: number;
};

/**
 * จุดข้อมูลแนวโน้มรายเดือน (MonthlyPoint)
 * ──────────────────────────────
 * ใช้กับ ColumnBarChart เพื่อแสดงแนวโน้มรายรับ–รายจ่ายย้อนหลัง
 */
export type MonthlyPoint = {
  /** เดือนในรูปแบบย่อ "MM/YY" เช่น "10/25" */
  month: string;

  /** ยอดรวมรายรับในเดือนนั้น */
  income: number;

  /** ยอดรวมรายจ่ายในเดือนนั้น */
  expense: number;
};

/**
 * ข้อมูลสรุปยอดรวม (Summary)
 * ──────────────────────────────
 * ใช้แสดงในการ์ดสรุป (ReportCards)
 *  - income: รายรับรวม
 *  - expense: รายจ่ายรวม
 *  - balance: รายรับ - รายจ่าย
 *  - transactions: จำนวนธุรกรรมทั้งหมด
 */
export type Summary = {
  income: number;
  expense: number;
  balance: number;
  /** จำนวน transaction ทั้งหมดที่ใช้ในช่วง scope */
  transactions: number;
};

/**
 * View Model หลักของหน้า /reports
 * ──────────────────────────────
 * คือ “ชุดข้อมูลเดียว” ที่ hook / service คืนให้ UI
 * - summary        → ใช้กับ ReportCards
 * - monthlySeries  → ใช้กับ ColumnBarChart
 * - categorySeries → ใช้กับ BarTrendChart
 */
export type ReportData = {
  summary: Summary;
  categorySeries: CategoryRow[];
  monthlySeries: MonthlyPoint[];
};
