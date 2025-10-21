// src/app/(protected)/transactions/page.tsx

import { Suspense } from "react";
import TransactionsClient from "./_components/transactions-client";
import TransactionsSkeleton from "./_components/transactions-skeleton";

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <TransactionsSkeleton />
        </div>
      }
    >
      <div className="p-4 md:p-6">
        <TransactionsClient />
      </div>
    </Suspense>
  );
}
