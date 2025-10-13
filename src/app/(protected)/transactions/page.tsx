// app/(protected)/transactions/page.tsx
import { Suspense } from "react";
import TransactionsClient from "./_components/transactions-client";

export default function TransactionsPage() {
  // Server Component ชั้นนอก: เผื่ออนาคต preload data / cookies / session
  return (
    <Suspense fallback={<div className="p-6">Loading transactions…</div>}>
      <TransactionsClient />
    </Suspense>
  );
}
