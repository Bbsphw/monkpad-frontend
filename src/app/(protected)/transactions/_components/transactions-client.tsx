// app/(protected)/transactions/_components/transactions-client.tsx

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/* ─────────── Local skeletons (ระหว่าง import client chunks) ─────────── */
function FiltersSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_180px_180px_auto] gap-3 items-end">
      <Skeleton className="h-9 w-full sm:col-span-2 lg:col-span-1" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <div className="flex lg:justify-end">
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
function ExportBtnSkeleton() {
  return <Skeleton className="h-9 w-28" />;
}
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
function ActionSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9" />
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

/* ─────────── Lazy components ─────────── */
const TransactionsProvider = dynamic(
  () => import("./transaction-filters").then((m) => m.TransactionsProvider),
  { ssr: false, loading: () => <></> }
);
const TransactionFilters = dynamic(
  () => import("./transaction-filters").then((m) => m.default),
  { ssr: false, loading: () => <FiltersSkeleton /> }
);
const TransactionTable = dynamic(
  () => import("./transaction-table").then((m) => m.default),
  { ssr: false, loading: () => <TableSkeleton /> }
);
const TransactionExportDialog = dynamic(
  () => import("./transaction-export-dialog").then((m) => m.default),
  { ssr: false, loading: () => <ExportBtnSkeleton /> }
);
const TransactionDeleteDialog = dynamic(
  () => import("./transaction-delete-dialog"),
  { ssr: false, loading: () => <ActionSkeleton /> }
);

export default function TransactionsClient() {
  return (
    <TransactionsProvider>
      <div className="space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <h1 className="text-xl md:text-2xl font-semibold">
              รายการธุรกรรมล่าสุด
            </h1>
            <p className="text-sm text-muted-foreground">
              กรอง & ส่งออกข้อมูลได้ตามช่วงเวลา
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <TransactionFilters />
          <div className="flex gap-2">
            <TransactionExportDialog />
          </div>
        </div>

        <TransactionTable />
      </div>
    </TransactionsProvider>
  );
}
