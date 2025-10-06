// FILE: src/lib/api/dashboard.ts (server-only)
import "server-only";

import type { DashboardStats, Transaction } from "@/types/dashoboard";

const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const mockStats: DashboardStats = {
  totalIncome: 45000,
  totalExpense: 28500,
  balance: 16500,
  transactionCount: 42,
  monthlyData: [
    { month: "ม.ค.", income: 35000, expense: 22000 },
    { month: "ก.พ.", income: 38000, expense: 25000 },
    { month: "มี.ค.", income: 42000, expense: 28000 },
    { month: "เม.ย.", income: 45000, expense: 28500 },
  ],
  categoryBreakdown: [
    { id: "1", name: "อาหาร", amount: 12000, percentage: 42 },
    { id: "2", name: "ค่าเดินทาง", amount: 6500, percentage: 23 },
    { id: "3", name: "ช้อปปิ้ง", amount: 5000, percentage: 18 },
    { id: "4", name: "อื่นๆ", amount: 5000, percentage: 17 },
  ],
};

const mockTxns: Transaction[] = [
  {
    id: "t1",
    date: "2025-09-20",
    type: "expense",
    category: "อาหาร",
    description: "ข้าวกลางวัน",
    amount: 95,
    account: "Wallet",
    status: "posted",
  },
  {
    id: "t2",
    date: "2025-09-20",
    type: "income",
    category: "เงินเดือน",
    description: "Salary",
    amount: 30000,
    account: "KBank",
    status: "posted",
  },
  {
    id: "t3",
    date: "2025-09-19",
    type: "expense",
    category: "เดินทาง",
    description: "BTS",
    amount: 44,
    account: "KBank",
    status: "posted",
  },
  {
    id: "t4",
    date: "2025-09-18",
    type: "expense",
    category: "ช้อปปิ้ง",
    description: "Shopee",
    amount: 399,
    account: "Credit Card",
    status: "posted",
  },
];

function computeDelta(data: DashboardStats) {
  const arr = data.monthlyData;
  if (arr.length < 2)
    return { income: "—", expense: "—", balance: "—" } as const;
  const prev = arr[arr.length - 2];
  const curr = arr[arr.length - 1];
  const pct = (a: number, b: number) =>
    `${
      Math.round(((a - b) / Math.max(b, 1)) * 100) >= 0 ? "+" : ""
    }${Math.round(((a - b) / Math.max(b, 1)) * 100)}% จากเดือนก่อน}`;
  const bal = (x: typeof curr) => x.income - x.expense;
  return {
    income: pct(curr.income, prev.income),
    expense: pct(curr.expense, prev.expense),
    balance: pct(bal(curr), bal(prev)),
  } as const;
}

export async function getDashboard(): Promise<{
  stats: DashboardStats;
  transactions: Transaction[];
  delta: { income: string; expense: string; balance: string };
  fmt: { thb: (n: number) => string };
}> {
  // Replace with real backend call when ready
  const base = process.env.BACKEND_URL;
  try {
    if (!base) throw new Error("BACKEND_URL not set");
    const [sRes, tRes] = await Promise.all([
      fetch(`${base}/api/reports/dashboard`, { cache: "no-store" }),
      fetch(`${base}/api/transactions?limit=20`, { cache: "no-store" }),
    ]);
    if (!sRes.ok || !tRes.ok) throw new Error("Failed to fetch");
    const stats = (await sRes.json()) as DashboardStats;
    const transactions = (await tRes.json()) as Transaction[];
    return {
      stats,
      transactions,
      delta: computeDelta(stats),
      fmt: { thb: (n: number) => THB.format(n) },
    };
  } catch {
    const stats = mockStats;
    const transactions = mockTxns;
    return {
      stats,
      transactions,
      delta: computeDelta(stats),
      fmt: { thb: (n: number) => THB.format(n) },
    };
  }
}
