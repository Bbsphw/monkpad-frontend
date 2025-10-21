// src/app/(protected)/transactions/_components/transactions-skeleton.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_180px_180px_auto] gap-3 w-full">
          <Skeleton className="h-9 w-full sm:col-span-2 lg:col-span-1" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <div className="flex lg:justify-end">
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
