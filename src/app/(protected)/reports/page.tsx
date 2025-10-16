import { Suspense } from "react";
import ReportClient from "./_components/report-client";

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลดรายงาน…</div>}>
      <ReportClient />
    </Suspense>
  );
}
