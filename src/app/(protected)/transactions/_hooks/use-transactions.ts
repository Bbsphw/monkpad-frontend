// src/app/(protected)/transactions/_hooks/use-transactions.ts

"use client";

import * as React from "react";
import useSWR from "swr";
import type { Transaction } from "../_types/transaction";

/* ----------------------------------------------------------------
 * SWR fetcher: ดึง "ธุรกรรมทั้งหมดของฉัน" ครั้งเดียว
 * - cache: "no-store" เพื่อไม่ให้ Next อิง cache ฝั่ง server
 * - ปรับรูปร่าง payload -> Transaction (type-safe) + sort ล่าสุดก่อน
 * - โยน Error เมื่อ !ok เพื่อให้ SWR จัดการสถานะ error ได้
 * ---------------------------------------------------------------- */
async function fetchAllTx(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions/me", { cache: "no-store" });
  const js = await res.json().catch(() => null);
  if (!res.ok || !js?.ok) throw new Error(js?.error?.message || "Fetch failed");

  // map/normalize รูปร่างข้อมูลให้แน่นอน (กัน backend เปลี่ยน field ชื่อ)
  const raw = Array.isArray(js.data) ? js.data : [];
  interface RawTransaction {
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

  const mapped: Transaction[] = (raw as RawTransaction[])
    .map((r: RawTransaction) => {
      const id: string = String(r.id ?? "");
      const date: string = String(r.date ?? "").slice(0, 10); // "YYYY-MM-DD"
      // จำกัด type ให้เป็น union เดียวกับฝั่ง UI
      const type: Transaction["type"] | null =
        r.type === "income"
          ? "income"
          : r.type === "expense"
          ? "expense"
          : null;
      if (!id || !date || !type) return null;

      return {
        id,
        date,
        time: r.time ? String(r.time) : undefined,
        type,
        category: String(r.tag ?? r.category ?? "อื่นๆ"),
        amount: Number(r.value ?? r.amount ?? 0) || 0,
        note: r.note ? String(r.note) : undefined,
      } as Transaction;
    })
    .filter(Boolean) as Transaction[];

  // เรียงล่าสุดก่อน (ใช้ string compare YYYY-MM-DD HH:mm)
  mapped.sort((a, b) =>
    `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`)
  );
  return mapped;
}

/* ----------------------------------------------------------------
 * Local state สำหรับ filter/pagination
 * - เก็บทุกอย่างใน memory (ไม่ยิง API เพิ่ม)
 * - page จะ reset -> 1 ทุกครั้งที่ filter อื่นเปลี่ยน ( UX คาดเดาได้ )
 * ---------------------------------------------------------------- */
export type UseTransactionsState = {
  q: string; // ค้นหา (category/note)
  type: "all" | "income" | "expense"; // ประเภทธุรกรรม
  category?: string; // ฟิลเตอร์ตามหมวด (ถ้าอนาคตเพิ่ม UI)
  dateFrom?: string; // YYYY-MM-DD เริ่ม
  dateTo?: string; // YYYY-MM-DD สิ้นสุด
  page: number; // หน้า
  pageSize: number; // จำนวนต่อหน้า
};

const INITIAL: UseTransactionsState = {
  q: "",
  type: "all",
  page: 1,
  pageSize: 15,
};

/* ----------------------------------------------------------------
 * useTransactions (public hook)
 * - SWR: ดึงครั้งเดียว เก็บใน cache, ปิด revalidate-on-focus เพื่อ UX ลื่น
 * - ฟัง event global "mp:transactions:changed" เพื่อ refresh อัตโนมัติ
 * - ทำ filter/paginate ใน memory: เร็ว, สม่ำเสมอ, ไม่มี network jitter
 * - ส่ง helper setFilter/reload และข้อมูล pagination กลับให้ UI ใช้
 * ---------------------------------------------------------------- */
export function useTransactions() {
  const [params, setParams] = React.useState<UseTransactionsState>(INITIAL);

  // ดึงข้อมูลทั้งหมดเพียง key เดียว → SWR จัด de-dupe และ cache ให้
  const {
    data: all,
    error,
    isLoading,
    mutate,
  } = useSWR(["transactions/me"], fetchAllTx, {
    dedupingInterval: 5000, // กันยิงซ้ำในช่วงสั้น ๆ (รวม StrictMode dev)
    revalidateOnFocus: false, // ปิดเพื่อไม่ให้รีเฟรชเมื่อสลับแท็บ (เลือก UX แบบคงที่)
    revalidateOnReconnect: false, // ปิดเพื่อไม่ช็อกผู้ใช้เมื่อเน็ตเด้ง
    keepPreviousData: true, // คง data เก่าไว้ระหว่างโหลดรอบใหม่ (ไม่ flash)
  });

  // ฟังสัญญาณส่วนกลาง: add/edit/delete จะ dispatch event นี้
  // แล้วค่อย revalidate cache ด้วย mutate()
  React.useEffect(() => {
    const handler = () => mutate();
    window.addEventListener("mp:transactions:changed", handler);
    return () => window.removeEventListener("mp:transactions:changed", handler);
  }, [mutate]);

  // ทำ filter ใน memory: O(n) แต่ n มักไม่มากสำหรับการแสดงผลหน้า UI
  // ถ้าอนาคต n ใหญ่ → สามารถย้าย filter ไป server หรือใช้ indexed search ได้
  const filtered = React.useMemo(() => {
    if (!all) return [];
    let rows = all;

    if (params.type !== "all")
      rows = rows.filter((r) => r.type === params.type);

    if (params.category)
      rows = rows.filter((r) => r.category === params.category);

    if (params.dateFrom) rows = rows.filter((r) => r.date >= params.dateFrom!);
    if (params.dateTo) rows = rows.filter((r) => r.date <= params.dateTo!);

    if (params.q) {
      const qq = params.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.category.toLowerCase().includes(qq) ||
          (r.note ?? "").toLowerCase().includes(qq)
      );
    }
    return rows;
  }, [all, params]);

  // Pagination (คำนวณหน้าอย่างปลอดภัยเสมอ)
  const { page, pageSize } = params;
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(Math.max(1, page), pages);

  const data = React.useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  // setFilter: merge แบบ partial + reset page หากผู้ใช้เปลี่ยนเงื่อนไขอื่น
  const setFilter = React.useCallback(
    (patch: Partial<UseTransactionsState>) => {
      setParams((prev) => {
        const next = { ...prev, ...patch };
        if (!("page" in patch)) next.page = 1; // ทุกครั้งที่เปลี่ยน filter -> กลับหน้า 1
        return next;
      });
    },
    []
  );

  return {
    // พารามิเตอร์และ setter สำหรับ UI
    params,
    setFilter,

    // แถวที่ผ่าน filter + paging แล้ว (พร้อมยิงเข้า Table)
    rows: data,

    // จำนวนรวมก่อน paging (ใช้โชว์ "ทั้งหมด n รายการ")
    total,

    // สถานะโหลด/ผิดพลาด (โยงกับ SWR)
    loading: isLoading,
    error: error ? (error as Error).message : null,

    // ข้อมูลหน้า (สำหรับ Pagination component)
    pagination: { page: pageSafe, pageSize, pages, total },

    // รีเฟรช cache เองได้ (เช่นหลัง action ภายในหน้า)
    reload: () => mutate(),
  };
}
