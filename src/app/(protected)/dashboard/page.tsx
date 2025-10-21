// src/app/(protected)/dashboard/page.tsx

import { Suspense } from "react";
import DashboardClient from "./_components/dashboard-client";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}
