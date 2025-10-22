// src/app/(protected)/transactions/_types/transaction.ts

/**
 * TxnType
 * --------
 * ใช้ระบุ “ประเภทธุรกรรม” ว่ารายการนั้นเป็นรายรับ (income)
 * หรือรายจ่าย (expense)
 *
 * - ใช้ union literal เพื่อให้ TypeScript ตรวจจับได้ชัดเจน
 * - แนะนำให้ backend ส่งเป็น string เดียวกันนี้เพื่อ mapping ตรงกัน 1:1
 */
export type TxnType = "income" | "expense";

/**
 * Transaction
 * ------------
 * Type หลักของข้อมูลธุรกรรมในระบบ MonkPad
 *
 * จุดประสงค์:
 * - ใช้เป็น domain model สำหรับ UI (table, chart, etc.)
 * - ใช้ร่วมกับ fetchers, SWR, และ service layer ได้โดยตรง
 * - ไม่ผูกกับรูปแบบ payload ของ backend (แต่ normalize ให้ตรงแล้ว)
 */
export interface Transaction {
  /** id ของธุรกรรม (Backend มักเป็น number → แปลงเป็น string เพื่อความสม่ำเสมอใน client) */
  id: string;

  /** วันที่ของธุรกรรม (รูปแบบ ISO: YYYY-MM-DD) */
  date: string;

  /** เวลา (ไม่บังคับ, HH:mm หรือ HH:mm:ss ตาม backend) */
  time?: string;

  /** ประเภทของธุรกรรม */
  type: TxnType;

  /** ชื่อหมวดหมู่ (backend: tag หรือ category) */
  category: string;

  /** จำนวนเงินของธุรกรรม (บวกเสมอ, ฝั่ง UI แยกสี/เครื่องหมายเองตาม type) */
  amount: number;

  /** โน้ตหรือรายละเอียดเพิ่มเติม (optional) */
  note?: string;
}
