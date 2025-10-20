// src/app/(protected)/dashboard/page.tsx

import { Suspense } from "react";
import DashboardClient from "./_components/dashboard-client";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
