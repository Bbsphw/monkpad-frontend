// src/app/(protected)/transactions/_components/transaction-table.tsx

"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useTransactionsContext } from "./transaction-filters";
import { cn } from "@/lib/utils";
import TransactionEditDialog from "./transaction-edit-dialog";
import TransactionDeleteDialog from "./transaction-delete-dialog";
import { useTags } from "@/hooks/use-tags";

/** formatter: แสดงจำนวนเงินเป็นสกุลบาทแบบ locale-aware */
function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function TransactionTable() {
  // ดึง state ที่จำเป็นจาก context เดียว:
  // - rows: แถวที่ผ่านการกรอง/แบ่งหน้าแล้ว
  // - loading: สถานะกำลังโหลด
  // - pagination: meta ของเพจปัจจุบัน
  // - setFilter: เปลี่ยนตัวกรอง/เพจ (single source of truth)
  // - reload: ใช้รีเฟรชข้อมูลเมื่อมี CRUD
  // const { rows, loading, pagination, setFilter, reload } =
  const { rows, loading, pagination, setFilter } = useTransactionsContext();

  const { tags } = useTags();

  /* ───────────────── Skeleton ระหว่างโหลด ─────────────────
   * แยก branch ชัดเจน ลด layout shift และทำให้ผู้ใช้เข้าใจว่ากำลังโหลด
   */
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  /* ───────────────── กรณีไม่มีข้อมูล ─────────────────
   * สื่อสารเรียบง่าย ไม่ต้องแสดง header ของตารางเพื่อลด visual noise
   */
  if (!rows.length) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">
          ไม่พบข้อมูล
        </CardContent>
      </Card>
    );
  }

  /* ───────────────── ตารางหลัก ─────────────────
   * ใช้ Table semantic ที่สอดคล้อง A11y
   * คุม overflow ที่ Card และจัด header แยกพื้นหลังให้สแกนได้ง่าย
   */
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[120px]">วันที่</TableHead>
              <TableHead className="w-[90px]">เวลา</TableHead>
              <TableHead className="w-[120px]">ประเภท</TableHead>
              <TableHead>หมวด</TableHead>
              <TableHead>รายละเอียด</TableHead>
              <TableHead className="text-right w-[160px]">จำนวนเงิน</TableHead>
              <TableHead className="w-[110px] text-right">การกระทำ</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => {
              const isIncome = r.type === "income";

              // หาจากชื่อหมวด เพื่อเดา id
              const matchedTag = tags.find(
                (t) => t.tag === r.category && t.type === r.type
              );
              const tagIdForThisRow = matchedTag ? matchedTag.id : undefined;

              return (
                <TableRow
                  key={r.id}
                  className="hover:bg-muted/30"
                  // hover state บาง ๆ เพื่อบอก interactivity โดยไม่รบกวนสายตา
                >
                  {/* วันที่: ใช้ locale th-TH และ tabular-nums ให้คอลัมน์นิ่งอ่านง่าย */}
                  <TableCell className="tabular-nums">
                    {new Date(r.date).toLocaleDateString("th-TH", {
                      year: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>

                  {/* เวลา: ตัดวินาที ถ้าไม่มีให้แสดง "-" เพื่อลด null confusion */}
                  <TableCell className="tabular-nums">
                    {r.time?.slice(0, 5) ?? "-"}
                  </TableCell>

                  {/* ประเภท: ใช้ badge แบบขอบสี + โทนสีตาม semantic (income/expense) */}
                  <TableCell>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium border",
                        isIncome
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      )}
                    >
                      {isIncome ? "รายรับ" : "รายจ่าย"}
                    </span>
                  </TableCell>

                  {/* หมวด: จำกัดความกว้าง + truncate ป้องกันตารางล้น */}
                  <TableCell className="truncate max-w-[220px]">
                    {r.category}
                  </TableCell>

                  {/* โน้ต: อนุญาตให้ยาวแต่ truncate เพื่อคงความสูงแถวเสถียร */}
                  <TableCell className="truncate max-w-[360px]">
                    {r.note ?? "-"}
                  </TableCell>

                  {/* จำนวนเงิน: ใช้สีตามชนิด + tabular-nums เพื่อ alignment */}
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-semibold",
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {isIncome
                      ? `+${formatTHB(r.amount)}`
                      : `−${formatTHB(r.amount)}`}
                  </TableCell>

                  {/* Actions: แยกแก้ไข/ลบดัวย dialog (optimistic UX ทำได้ในอนาคต) */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <TransactionEditDialog
                        id={String(r.id)}
                        defaultValues={{
                          amount: r.amount,
                          note: r.note ?? "",
                          date: r.date,
                          time: r.time?.slice(0, 5) ?? "12:00",
                          tag_id: tagIdForThisRow as number, // 👈 เราพยายามส่ง id
                          type: r.type,
                        }}
                        // onUpdated={reload} // ถ้าต้องการให้ตารางรีเฟรชทันที ใช้ callback นี้ได้
                        size="icon"
                      />
                      <TransactionDeleteDialog row={r} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* ───────────── Footer / Pagination ─────────────
         * - ใช้ setFilter ที่เดียวเพื่อ sync กับ SWR key และ cache
         * - ปุ่มถูก disable ตามเงื่อนไขหน้าแรก/หน้าสุดท้าย
         */}
        <div className="flex flex-col gap-3 border-t bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            ทั้งหมด {pagination.total} รายการ
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter({ page: 1 })}
              disabled={pagination.page <= 1}
              aria-label="หน้าแรก"
            >
              « หน้าแรก
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilter({ page: Math.max(1, pagination.page - 1) })
              }
              disabled={pagination.page <= 1}
              aria-label="ก่อนหน้า"
            >
              ‹ ก่อนหน้า
            </Button>

            <div className="px-2 text-sm tabular-nums">
              หน้า {pagination.page} / {pagination.pages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilter({
                  page: Math.min(pagination.pages, pagination.page + 1),
                })
              }
              disabled={pagination.page >= pagination.pages}
              aria-label="ถัดไป"
            >
              ถัดไป ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter({ page: pagination.pages })}
              disabled={pagination.page >= pagination.pages}
              aria-label="หน้าสุดท้าย"
            >
              สุดท้าย »
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
//update file