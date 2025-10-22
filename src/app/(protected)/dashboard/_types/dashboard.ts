// src/app/(protected)/dashboard/_types/dashboard.ts

/* ───────────────────────────── Summary Types ───────────────────────────── */

/**
 * SummaryDTO
 * - ใช้ในชั้น Data Transfer Object (จาก backend API → client)
 * - บาง endpoint ส่งมาแค่ income / expense / balance
 * - ไม่มี year/month → เหมาะกับ payload สั้น เช่น /api/summary/today
 */
export type SummaryDTO = {
  income: number; // ยอดรวมรายรับ (≥ 0)
  expense: number; // ยอดรวมรายจ่าย (≥ 0)
  balance: number; // รายรับ - รายจ่าย (อาจติดลบได้)
};

/**
 * SummaryPayload
 * - ใช้ภายในแดชบอร์ดหลัง derive แล้ว (ฝั่ง client)
 * - มีปี/เดือน เพื่ออ้างอิงช่วงเวลาอย่างชัดเจน
 * - ใช้ใน hook useDashboard() และ DashboardClient
 */
export type SummaryPayload = {
  year: number; // ปี (เช่น 2025)
  month: number; // เดือน (1–12)
  income: number; // ยอดรวมรายรับ
  expense: number; // ยอดรวมรายจ่าย
  balance: number; // ยอดคงเหลือ (income - expense)
};

/* ───────────────────────────── Category Types ───────────────────────────── */

/**
 * CategoryRow
 * - ใช้ในหมวดหมู่รายจ่าย/รายรับ (เช่นโดนัทชาร์ต)
 * - category: ชื่อหมวดหมู่
 * - expense : ยอดรวมของหมวดนั้นในเดือน
 *
 * ⚠️ หมายเหตุ:
 *   - ฝั่ง derive (buildCategorySeries) กำหนดชื่อ key = "expense" เพื่อความสอดคล้อง
 *     กับรายจ่ายเป็นหลัก แม้ใช้กับรายรับก็ยังใช้ชื่อฟิลด์เดิมเพื่อ UI reuse ได้
 */
export type CategoryRow = {
  category: string;
  expense: number;
};

/* ───────────────────────────── Traffic Types ───────────────────────────── */

/**
 * TrafficPoint
 * - ชุดข้อมูลแนวโน้มรายเดือน (เช่นใช้ในกราฟสรุปรายเดือน)
 * - month: รูปแบบ "MM/YY" เช่น "01/25" → แสดงผลสั้นใน legend
 * - income / expense: รวมรายรับ-รายจ่ายของเดือนนั้น
 *
 * 🧭 ใช้ภายใน buildMonthlyTraffic() และส่งต่อให้ toAreaSeries()
 */
export type TrafficPoint = {
  month: string; // เช่น "01/25"
  income: number;
  expense: number;
};

/**
 * TrafficAreaPoint
 * - ใช้กับกราฟ AreaChart (เช่น TrafficAreaChart)
 * - date: ใช้รูปแบบเต็ม ISO (YYYY-MM-01) เพื่อ align กับแกน X ของ Recharts
 * - income / expense: ค่าจำนวนเงินที่สรุปมาแล้ว
 *
 * 🧩 มาจากฟังก์ชัน toAreaSeries()
 */
export type TrafficAreaPoint = {
  date: string; // "YYYY-MM-01" (ใช้วันแรกของเดือนเพื่อคำนวณแกน X)
  income: number;
  expense: number;
};

/* ───────────────────────────── Recent Transaction Types ───────────────────────────── */

/**
 * RecentRow
 * - ธุรกรรมล่าสุด (ใช้ในตาราง RecentTransactionsTable)
 * - id       : รหัสธุรกรรม (string | number)
 * - date/time: วันที่–เวลา สำหรับเรียงลำดับล่าสุดก่อน
 * - type     : "income" หรือ "expense"
 * - category : ชื่อหมวดหมู่ (หรือ tag) ที่แสดงในตาราง
 * - amount/value : จำนวนเงิน (บาง API ส่ง amount, บางตัวส่ง value)
 * - note     : ข้อความโน้ตเพิ่มเติม
 *
 * ⚙️ ใช้หลัง derive ใน buildRecent() ก่อนส่งให้ component แสดงผล
 */
export type RecentRow = {
  id: number | string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (optional)
  type: "income" | "expense";
  tag?: string; // แท็กของหมวด (optional)
  category?: string; // ชื่อหมวด (ถ้ามี)
  amount?: number; // ค่าที่ normalize แล้ว (priority)
  value?: number; // legacy fallback
  note?: string; // โน้ตเพิ่มเติม
};
