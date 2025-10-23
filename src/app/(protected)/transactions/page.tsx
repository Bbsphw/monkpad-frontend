// src/app/(protected)/transactions/page.tsx

import { Suspense } from "react";
import TransactionsClient from "./_components/transactions-client";
import TransactionsSkeleton from "./_components/transactions-skeleton";

/**
 * TransactionsPage
 * -----------------
 * หน้า “รายการธุรกรรม” (protected route)
 * ใช้ Suspense ครอบ TransactionsClient เพื่อให้สามารถแสดง Skeleton ระหว่างโหลด client bundle
 *
 * 🔹 Design:
 * - Layout spacing คงที่ (p-4 md:p-6)
 * - ใช้ Skeleton สำหรับ UX ที่ลื่นไหล (ไม่มี flash)
 * - ไม่ SSR เพราะข้อมูลโหลดฝั่ง client (ผ่าน SWR / fetch / useTransactions)
 */
export default function TransactionsPage() {
  return (
    <Suspense
      // fallback: โหลด TransactionsSkeleton แทน UI จริงระหว่าง import dynamic component
      fallback={
        <div className="p-4 md:p-6">
          <TransactionsSkeleton />
        </div>
      }
    >
      {/* Client component หลัก */}
      <div className="p-4 md:p-6">
        <TransactionsClient />
      </div>
    </Suspense>
  );
}
