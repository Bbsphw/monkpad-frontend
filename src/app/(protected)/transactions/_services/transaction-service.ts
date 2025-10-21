// src/app/(protected)/transactions/_services/transaction-service.ts

"use client";

import type { Transaction } from "../_types/transaction";

export type ListParams = {
  q?: string;
  type?: "all" | "income" | "expense";
  category?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

export type ListResult = {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
};

function normalizeRow(r: any): Transaction | null {
  if (!r) return null;
  const id = String(r.id ?? "");
  const date = String(r.date ?? "").slice(0, 10);
  const type = (
    r.type === "income" ? "income" : r.type === "expense" ? "expense" : null
  ) as "income" | "expense" | null;
  if (!id || !date || !type) return null;
  return {
    id,
    date,
    time: r.time ? String(r.time) : undefined,
    type,
    category: String(r.tag ?? r.category ?? "อื่นๆ"),
    amount: Number(r.value ?? r.amount ?? 0) || 0,
    note: r.note ? String(r.note) : undefined,
  };
}

async function fetchAll(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions/me", { cache: "no-store" });
  const js = await res.json().catch(() => null);
  if (!res.ok || !js?.ok) {
    throw new Error(js?.error?.message || "Fetch transactions failed");
  }
  const raw = Array.isArray(js.data) ? js.data : [];
  const mapped = raw.map(normalizeRow).filter(Boolean) as Transaction[];
  // sort ใหม่ (ล่าสุดก่อน) ตาม date+time
  mapped.sort((a, b) => {
    const ak = `${a.date} ${a.time ?? ""}`;
    const bk = `${b.date} ${b.time ?? ""}`;
    return bk.localeCompare(ak);
  });
  return mapped;
}

export const TransactionService = {
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

    // filters
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

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const data = rows.slice(start, start + pageSize);

    return { data, total, page, pageSize };
  },

  async exportCSV(params: ListParams = {}): Promise<Blob> {
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
          r.category.replace(/"/g, '""'),
          r.amount,
          (r.note ?? "").replace(/"/g, '""'),
        ]
          .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
          .join(",")
      )
      .join("\n");
    const csv = `${header}\n${body}`;
    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  },
};
