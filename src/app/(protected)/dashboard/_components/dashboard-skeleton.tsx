// src/app/(protected)/dashboard/_components/dashboard-skeleton.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-[160px]" />
        <Skeleton className="h-4 w-[260px]" />
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>

      {/* Chart section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[320px] lg:col-span-2 rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>

      {/* Recent transactions table */}
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
