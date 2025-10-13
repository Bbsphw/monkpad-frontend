// app/(protected)/transactions/_types/transaction.d.ts
export type TxnType = "income" | "expense" | "transfer";
export type TxnStatus = "draft" | "posted" | "void";
export type TxnSource = "manual" | "ocr";

export interface Transaction {
  id: string;
  date: string; // ISO string (YYYY-MM-DD)
  type: TxnType;
  category: string;
  amount: number;
  note?: string;
  status: TxnStatus;
  source: TxnSource;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
