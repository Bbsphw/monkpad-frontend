// app/(protected)/transactions/_hooks/use-transactions.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TransactionService,
  type ListParams,
} from "../_services/transaction-service";
import type { Transaction } from "../_types/transaction";

export type UseTransactionsState = {
  q: string;
  type: "all" | "income" | "expense" | "transfer";
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
  pageSize: 10, // ล็อกหน้า/ละ 10
};

export function useTransactions() {
  const [params, setParams] = useState<UseTransactionsState>(INITIAL);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (override?: Partial<ListParams>) => {
      setLoading(true);
      try {
        const res = await TransactionService.list({ ...params, ...override });
        setRows(res.data);
        setTotal(res.total);
        if (override?.page) {
          setParams((p) => ({ ...p, page: override.page! }));
        }
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  useEffect(() => {
    load();
  }, [
    params.q,
    params.type,
    params.category,
    params.dateFrom,
    params.dateTo,
    params.page,
    params.pageSize,
    load,
  ]);

  // ✅ ไม่รีเซ็ตหน้าเมื่อ patch มี page มาแล้ว
  const setFilter = useCallback((patch: Partial<UseTransactionsState>) => {
    setParams((prev) => {
      const next = { ...prev, ...patch };
      if (!("page" in patch)) next.page = 1;
      return next;
    });
  }, []);

  const pagination = useMemo(() => {
    const pages = Math.max(1, Math.ceil(total / params.pageSize));
    return { page: params.page, pageSize: params.pageSize, pages, total };
  }, [params.page, params.pageSize, total]);

  return {
    params,
    setFilter,
    rows,
    total,
    loading,
    pagination,
    reload: () => load(),
  };
}
