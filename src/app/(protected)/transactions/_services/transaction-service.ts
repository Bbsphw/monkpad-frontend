// src/app/(protected)/transactions/_services/transaction-service.ts

"use client";

import type { Transaction } from "../_types/transaction";

/**
 * พารามิเตอร์ของการดึงรายการแบบฝั่ง client
 * - ทุก filter เป็น optional เพื่อให้ใช้ default ได้
 */
export type ListParams = {
  q?: string; // คำค้นหา (match category/note แบบ partial, case-insensitive)
  type?: "all" | "income" | "expense";
  category?: string; // กรองตามชื่อหมวด (exact match)
  dateFrom?: string; // ช่วงวันที่เริ่ม (YYYY-MM-DD)
  dateTo?: string; // ช่วงวันที่สิ้นสุด (YYYY-MM-DD)
  page?: number; // หน้าปัจจุบัน (เริ่ม 1)
  pageSize?: number; // จำนวนแถวต่อหน้า
};

/** รูปแบบผลลัพธ์รวม pagination (หลัง filter/paginate) */
export type ListResult = {
  data: Transaction[]; // แถวที่แสดงในหน้านี้
  total: number; // จำนวนทั้งหมดของแถวที่ผ่าน filter
  page: number; // หน้าปัจจุบัน (normalized แล้ว)
  pageSize: number; // ขนาดหน้า
};

interface typeTransaction {
  id?: string | number | null;
  date?: string | null;
  time?: string | null;
  type?: string | null;
  tag?: string | null;
  category?: string | null;
  value?: number | null;
  amount?: number | null;
  note?: string | null;
  [key: string]: unknown;
}

/**
 * normalizeRow:
 * - ปรับ raw record จาก API ให้เป็น Transaction ที่ type-safe
 * - ป้องกันค่าแปลก เช่น null/undefined/format ผิด
 * - คืน null เมื่อข้อมูลสำคัญหายไป (id/date/type)
 */
function normalizeRow(r: typeTransaction): Transaction | null {
  if (!r) return null;
  const id = String(r.id ?? "");
  const date = String(r.date ?? "").slice(0, 10); // ตัดให้เหลือ YYYY-MM-DD
  const type = (
    r.type === "income" ? "income" : r.type === "expense" ? "expense" : null
  ) as "income" | "expense" | null;

  if (!id || !date || !type) return null;

  return {
    id,
    date,
    time: r.time ? String(r.time) : undefined, // time: string | undefined
    type,
    category: String(r.tag ?? r.category ?? "อื่นๆ"), // รองรับ backend ที่ส่ง tag หรือ category
    amount: Number(r.value ?? r.amount ?? 0) || 0, // รองรับฟิลด์ value/amount
    note: r.note ? String(r.note) : undefined,
  };
}

/**
 * fetchAll:
 * - ดึง /api/transactions/me แค่ครั้งเดียว (no-store ป้องกัน cache ฝั่ง browser)
 * - map → normalize → sort (ล่าสุดก่อน) ด้วย key `${date} ${time}`
 * - โยน Error เมื่อ API ตอบไม่ ok เพื่อให้ layer บน (SWR/ผู้เรียก) จัดการ
 */
async function fetchAll(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions/me", { cache: "no-store" });
  const js = await res.json().catch(() => null);
  if (!res.ok || !js?.ok) {
    throw new Error(js?.error?.message || "Fetch transactions failed");
  }

  const raw = Array.isArray(js.data) ? js.data : [];
  const mapped = raw.map(normalizeRow).filter(Boolean) as Transaction[];

  // เรียงล่าสุดก่อน โดยอาศัยการเปรียบเทียบ string ของ "YYYY-MM-DD HH:mm:ss"
  mapped.sort((a, b) => {
    const ak = `${a.date} ${a.time ?? ""}`;
    const bk = `${b.date} ${b.time ?? ""}`;
    return bk.localeCompare(ak);
  });

  return mapped;
}

/**
 * TransactionService:
 * - list: ทำ filter + paginate ในหน่วยความจำ (หลังดึงทั้งหมดมาแล้ว)
 * - exportCSV: ใช้ list (page ใหญ่) แล้วแปลงเป็น CSV Blob พร้อม escaping
 */
export const TransactionService = {
  /**
   * list:
   * 1) ดึงทั้งหมด (fetchAll)
   * 2) filter ตาม type/category/dateFrom/dateTo/q
   * 3) คำนวณ pagination แล้วตัด slice ตาม page/pageSize
   * *หมายเหตุ*: เป็น in-memory filtering: เร็ว/ลื่นสำหรับ datasets ขนาดเล็ก-กลาง
   */
  async list(params: ListParams = {}): Promise<ListResult> {
    const {
      q = "",
      type = "all",
      category,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 10,
    } = params;

    const all = await fetchAll();

    // ----- Filters -----
    let rows = all;
    if (type !== "all") rows = rows.filter((r) => r.type === type);
    if (category) rows = rows.filter((r) => r.category === category);
    if (dateFrom) rows = rows.filter((r) => r.date >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.date <= dateTo);
    if (q) {
      const qq = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.category.toLowerCase().includes(qq) ||
          (r.note ?? "").toLowerCase().includes(qq)
      );
    }

    // ----- Pagination -----
    const total = rows.length;
    const start = (page - 1) * pageSize;
    const data = rows.slice(start, start + pageSize);

    return { data, total, page, pageSize };
  },

  /**
   * exportCSV:
   * - เรียก list ด้วย page ใหญ่ (ดึงทั้งหมดตามเงื่อนไข)
   * - ทำ CSV ด้วย header คงที่
   * - escape เครื่องหมายคำพูด (") ในฟิลด์ข้อความ และครอบด้วย " เมื่อมีเครื่องหมายจุลภาค
   * - คืนค่าเป็น Blob ("text/csv;charset=utf-8;") ให้ฝั่ง UI ทำ download ต่อ
   */
  async exportCSV(params: ListParams = {}): Promise<Blob> {
    // pageSize ตั้งให้ใหญ่พอเพื่อให้ครอบคลุมทั้งผลลัพธ์ (กรณีข้อมูลเยอะมาก อาจทำเป็นแบ่งหน้า/streaming)
    const { data } = await this.list({ ...params, page: 1, pageSize: 50_000 });

    const header = [
      "id",
      "date",
      "time",
      "type",
      "category",
      "amount",
      "note",
    ].join(",");

    const body = data
      .map((r) =>
        [
          r.id,
          r.date,
          r.time ?? "",
          r.type,
          r.category.replace(/"/g, '""'), // escape "
          r.amount,
          (r.note ?? "").replace(/"/g, '""'), // escape "
        ]
          // ถ้ามี comma ให้ครอบด้วยเครื่องหมายคำพูดตามมาตรฐาน CSV
          .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
          .join(",")
      )
      .join("\n");

    const csv = `${header}\n${body}`;
    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  },
};
