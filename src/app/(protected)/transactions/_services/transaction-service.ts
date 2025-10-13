// app/(protected)/transactions/_services/transaction-service.ts
"use client";

import { MOCK_TXNS } from "../_data/mock";
import type { Transaction } from "../_types/transaction";
import { nanoid } from "nanoid";
import {
  transactionSchema,
  TransactionFormValues,
} from "../_schemas/transaction-schema";

// NOTE: ตรงนี้เป็น mock service; ต่อ API จริงให้แทนที่ fetch/* ด้วย lib/api-client
let memory = [...MOCK_TXNS];

export type ListParams = {
  q?: string;
  type?: "all" | "income" | "expense" | "transfer";
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

    let rows = [...memory];

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

    rows.sort((a, b) => (a.date < b.date ? 1 : -1));

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const data = rows.slice(start, start + pageSize);

    return { data, total, page, pageSize };
  },

  async create(payload: TransactionFormValues): Promise<Transaction> {
    const parsed = transactionSchema.parse(payload);
    const now = new Date().toISOString();
    const row: Transaction = {
      ...parsed,
      id: `txn_${nanoid(8)}`,
      createdAt: now,
      updatedAt: now,
    };
    memory.unshift(row);
    return row;
  },

  async update(
    id: string,
    payload: TransactionFormValues
  ): Promise<Transaction> {
    const parsed = transactionSchema.parse(payload);
    const idx = memory.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Transaction not found");
    const updated = {
      ...memory[idx],
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    memory[idx] = updated;
    return updated;
  },

  async remove(id: string): Promise<void> {
    memory = memory.filter((r) => r.id !== id);
  },

  async exportCSV(params: ListParams = {}): Promise<Blob> {
    const { data } = await this.list({ ...params, page: 1, pageSize: 10_000 });
    const header = [
      "id",
      "date",
      "type",
      "category",
      "amount",
      "note",
      "status",
      "source",
    ].join(",");
    const body = data
      .map((r) =>
        [
          r.id,
          r.date,
          r.type,
          r.category,
          r.amount,
          JSON.stringify(r.note ?? ""),
          r.status,
          r.source,
        ].join(",")
      )
      .join("\n");
    const csv = `${header}\n${body}`;
    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  },
};
