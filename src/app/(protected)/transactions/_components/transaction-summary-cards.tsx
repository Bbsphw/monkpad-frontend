// app/(protected)/transactions/_components/transaction-summary-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactionsContext } from "./transaction-filters";

export default function TransactionSummaryCards() {
  const { rows } = useTransactionsContext();
  const income = rows
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + r.amount, 0);
  const expense = rows
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + r.amount, 0);
  const balance = income - expense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <MiniCard title="รายรับ (หน้านี้)" value={income} />
      <MiniCard title="รายจ่าย (หน้านี้)" value={expense} />
      <MiniCard title="คงเหลือ (หน้านี้)" value={balance} />
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        {value.toLocaleString()}
      </CardContent>
    </Card>
  );
}
