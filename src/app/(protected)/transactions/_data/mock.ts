// app/(protected)/transactions/_data/mock.ts
import type { Transaction } from "../_types/transaction";

export const MOCK_TXNS: Transaction[] = [
  {
    id: "txn_1001",
    date: "2025-10-06",
    type: "expense",
    category: "Food",
    amount: 120,
    note: "ข้าวกลางวัน",
    status: "posted",
    source: "manual",
    createdAt: "2025-10-06T10:00:00Z",
    updatedAt: "2025-10-06T10:00:00Z",
  },
  {
    id: "txn_1002",
    date: "2025-10-07",
    type: "income",
    category: "Salary",
    amount: 15000,
    note: "Part-time",
    status: "posted",
    source: "manual",
    createdAt: "2025-10-07T12:00:00Z",
    updatedAt: "2025-10-07T12:00:00Z",
  },
  {
    id: "txn_1003",
    date: "2025-10-08",
    type: "expense",
    category: "Transport",
    amount: 45,
    note: "รถไฟฟ้า",
    status: "posted",
    source: "ocr",
    createdAt: "2025-10-08T15:00:00Z",
    updatedAt: "2025-10-08T15:00:00Z",
  },
];
