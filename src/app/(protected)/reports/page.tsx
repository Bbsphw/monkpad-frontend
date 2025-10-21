// src/app/(protected)/reports/page.tsx
import { Suspense } from "react";
import ReportClient from "./_components/report-client";
import { ReportSkeleton } from "./_components/report-skeleton";

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportClient />
    </Suspense>
  );
}
