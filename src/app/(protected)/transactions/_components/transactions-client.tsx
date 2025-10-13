// app/(protected)/transactions/_components/transactions-client.tsx
"use client";

import TransactionSummaryCards from "./transaction-summary-cards";
import TransactionFilters, {
  TransactionsProvider,
} from "./transaction-filters";
import TransactionTable from "./transaction-table";
import TransactionAddDialog from "./transaction-add-dialog";
import TransactionExportDialog from "./transaction-export-dialog";

export default function TransactionsClient() {
  return (
    <TransactionsProvider>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <TransactionFilters />
          <div className="flex gap-2">
            <TransactionExportDialog />
            <TransactionAddDialog />
          </div>
        </div>

        {/* <TransactionSummaryCards /> */}
        <TransactionTable />
      </div>
    </TransactionsProvider>
  );
}
