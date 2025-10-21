// src/app/(protected)/transactions/_types/transaction.ts

export type TxnType = "income" | "expense";

export interface Transaction {
  id: string; // backend: number → map เป็น string
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss | HH:mm
  type: TxnType; // income | expense
  category: string; // backend: tag
  amount: number; // backend: value
  note?: string;
}
