// // app/(protected)/transactions/_hooks/use-transactions.ts

// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   TransactionService,
//   type ListParams,
// } from "../_services/transaction-service";
// import type { Transaction } from "../_types/transaction";

// export type UseTransactionsState = {
//   q: string;
//   type: "all" | "income" | "expense";
//   category?: string;
//   dateFrom?: string;
//   dateTo?: string;
//   page: number;
//   pageSize: number;
// };

// const INITIAL: UseTransactionsState = {
//   q: "",
//   type: "all",
//   page: 1,
//   pageSize: 15,
// };

// export function useTransactions() {
//   const [params, setParams] = useState<UseTransactionsState>(INITIAL);
//   const [rows, setRows] = useState<Transaction[]>([]);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   const load = useCallback(
//     async (override?: Partial<ListParams>) => {
//       setLoading(true);
//       setErr(null);
//       try {
//         const res = await TransactionService.list({ ...params, ...override });
//         setRows(res.data);
//         setTotal(res.total);
//         if (override?.page) {
//           setParams((p) => ({ ...p, page: override.page! }));
//         }
//       } catch (e: any) {
//         setErr(e?.message || "โหลดรายการไม่สำเร็จ");
//         setRows([]);
//         setTotal(0);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [params]
//   );

//   useEffect(() => {
//     load();
//   }, [
//     params.q,
//     params.type,
//     params.category,
//     params.dateFrom,
//     params.dateTo,
//     params.page,
//     params.pageSize,
//     load,
//   ]);

//   const setFilter = useCallback((patch: Partial<UseTransactionsState>) => {
//     setParams((prev) => {
//       const next = { ...prev, ...patch };
//       if (!("page" in patch)) next.page = 1;
//       return next;
//     });
//   }, []);

//   const pagination = useMemo(() => {
//     const pages = Math.max(1, Math.ceil(total / params.pageSize));
//     return { page: params.page, pageSize: params.pageSize, pages, total };
//   }, [params.page, params.pageSize, total]);

//   return {
//     params,
//     setFilter,
//     rows,
//     total,
//     loading,
//     error: err,
//     pagination,
//     reload: () => load(),
//   };
// }

// src/app/(protected)/transactions/_hooks/use-transactions.ts

"use client";

import * as React from "react";
import useSWR from "swr";
import type { Transaction } from "../_types/transaction";

/* ---------------- SWR: fetcher ทุกอย่างครั้งเดียว ---------------- */
async function fetchAllTx(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions/me", { cache: "no-store" });
  const js = await res.json().catch(() => null);
  if (!res.ok || !js?.ok) throw new Error(js?.error?.message || "Fetch failed");

  const raw = Array.isArray(js.data) ? js.data : [];
  const mapped: Transaction[] = raw
    .map((r: any) => {
      const id = String(r.id ?? "");
      const date = String(r.date ?? "").slice(0, 10);
      const type =
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

  // sort ล่าสุดก่อน
  mapped.sort((a, b) =>
    `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`)
  );
  return mapped;
}

/* ---------------- state ของ filter ---------------- */
export type UseTransactionsState = {
  q: string;
  type: "all" | "income" | "expense";
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
};
const INITIAL: UseTransactionsState = {
  q: "",
  type: "all",
  page: 1,
  pageSize: 15,
};

/* ---------------- public hook ---------------- */
export function useTransactions() {
  const [params, setParams] = React.useState<UseTransactionsState>(INITIAL);

  // ✅ ดึงครั้งเดียวด้วย SWR + de-dupe (Strict mode ก็ไม่ยิงเพิ่ม)
  const {
    data: all,
    error,
    isLoading,
    mutate,
  } = useSWR(["transactions/me"], fetchAllTx, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
  });

  // ✅ ฟังสัญญาณส่วนกลาง แล้วรีโหลด
  React.useEffect(() => {
    const handler = () => mutate();
    window.addEventListener("mp:transactions:changed", handler);
    return () => window.removeEventListener("mp:transactions:changed", handler);
  }, [mutate]);

  // ✅ filter/paginate ใน memory — ไม่ยิงเน็ตเพิ่ม
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

  const { page, pageSize } = params;
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(Math.max(1, page), pages);
  const data = React.useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  const setFilter = React.useCallback(
    (patch: Partial<UseTransactionsState>) => {
      setParams((prev) => {
        const next = { ...prev, ...patch };
        if (!("page" in patch)) next.page = 1;
        return next;
      });
    },
    []
  );

  return {
    params,
    setFilter,
    rows: data,
    total,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    pagination: { page: pageSafe, pageSize, pages, total },
    // ✅ ใช้ mutate เพื่อ revalidate cache หลัง add/edit/delete
    reload: () => mutate(),
  };
}
