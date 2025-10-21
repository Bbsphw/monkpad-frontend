// src/app/(protected)/reports/_components/report-skleton.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ReportSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-[180px]" />
        <Skeleton className="h-4 w-[280px]" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[180px] rounded-xl col-span-1" />
        <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
      </div>

      {/* Bar trend chart */}
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
