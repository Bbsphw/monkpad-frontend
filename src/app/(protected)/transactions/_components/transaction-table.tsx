// app/(protected)/transactions/_components/transaction-table.tsx
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
import { Badge } from "@/components/ui/badge";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionsContext } from "./transaction-filters";
import type { Transaction } from "../_types/transaction";
import { TransactionService } from "../_services/transaction-service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Compact table + Delete confirmation dialog (icon-only trigger)
 * - ไม่มี scroll แนวนอน (table-fixed + truncate)
 * - Pagination: First/Prev/Next/Last
 * - ลบด้วยไอคอนถังขยะ + ยืนยันก่อนลบ
 */
const TransactionTable: React.FC = () => {
  const { rows, loading, pagination, setFilter } = useTransactionsContext();

  if (!loading && rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        ไม่พบรายการ
      </div>
    );
  }

  const { page, pages, total } = pagination;

  return (
    <div className="rounded-md border overflow-hidden">
      <Table className="table-fixed w-full text-sm">
        <TableHeader className="bg-muted/30">
          <TableRow className="[&>th]:px-2 [&>th]:py-2">
            <TableHead className="w-[120px]">วันที่</TableHead>
            <TableHead className="w-[110px]">ประเภท</TableHead>
            <TableHead className="w-[180px]">หมวดหมู่</TableHead>
            <TableHead className="hidden sm:table-cell">รายละเอียด</TableHead>
            <TableHead className="text-right w-[140px]">จำนวนเงิน</TableHead>
            <TableHead className="w-[80px] text-center">ลบ</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((r) => (
            <TxnRow key={r.id} row={r} />
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          ทั้งหมด {total} รายการ
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFilter({ page: 1 })}
            disabled={page <= 1}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFilter({ page: Math.max(1, page - 1) })}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="px-2 text-sm tabular-nums">
            หน้า {page} / {pages}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFilter({ page: Math.min(pages, page + 1) })}
            disabled={page >= pages}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFilter({ page: pages })}
            disabled={page >= pages}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;

/* ──────────────── Transaction Row ──────────────── */
const TxnRow: React.FC<{ row: Readonly<Transaction> }> = ({ row }) => {
  const isIncome = row.type === "income";
  return (
    <TableRow className="hover:bg-muted/30 transition-colors [&>td]:px-2 [&>td]:py-2">
      <TableCell className="tabular-nums whitespace-nowrap">
        {new Date(row.date).toLocaleDateString("th-TH", {
          year: "2-digit",
          month: "short",
          day: "numeric",
        })}
      </TableCell>

      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium capitalize",
            isIncome
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
          )}
        >
          {isIncome ? "income" : "expense"}
        </Badge>
      </TableCell>

      <TableCell className="truncate max-w-[160px]">{row.category}</TableCell>
      <TableCell className="hidden sm:table-cell max-w-[260px] truncate">
        {row.note ?? "-"}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-semibold tabular-nums whitespace-nowrap",
          isIncome
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        )}
      >
        {isIncome ? `+${formatTHB(row.amount)}` : `-${formatTHB(row.amount)}`}
      </TableCell>

      <TableCell className="text-center">
        <DeleteConfirm row={row} />
      </TableCell>
    </TableRow>
  );
};

/* ──────────────── Delete Confirm (icon trigger) ──────────────── */
const DeleteConfirm: React.FC<{ row: Readonly<Transaction> }> = ({ row }) => {
  const { reload } = useTransactionsContext();
  const [open, setOpen] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);

  const onConfirm = async (): Promise<void> => {
    try {
      setLoading(true);
      await TransactionService.remove(row.id);
      toast.success("ลบรายการสำเร็จ");
      setOpen(false);
      reload();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "ลบไม่สำเร็จ";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              {/* ไอคอนถังขยะ: ghost + สีแดงตอน hover, A11y พร้อม aria-label */}
              <Button
                aria-label="ลบรายการนี้"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          {/* <TooltipContent>ลบรายการ</TooltipContent> */}
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="w-[92vw] max-w-[440px] p-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        {/* A11y: Dialog ต้องมี Title เสมอ */}
        <VisuallyHidden>
          <DialogTitle>ยืนยันการลบรายการ</DialogTitle>
        </VisuallyHidden>

        {/* แถบแดงบน */}
        <div className="h-12 w-full bg-destructive" />

        {/* เนื้อหากลาง */}
        <div className="flex flex-col items-center justify-center text-center px-6 pt-8 pb-4 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <Alert
            variant="destructive"
            className="border-0 bg-transparent p-0 flex flex-col items-center text-center"
          >
            <AlertTitle className="text-xl font-semibold text-foreground">
              ยืนยันการลบรายการ
            </AlertTitle>
            <AlertDescription className="mt-2 text-base flex flex-col items-center justify-center text-center">
              <span className="text-foreground/90">{row.category}</span>
              <span className="font-semibold text-destructive">
                {formatTHB(row.amount)}
              </span>
            </AlertDescription>
          </Alert>
        </div>

        {/* ปุ่ม */}
        <div className="px-6 pb-6 flex items-center justify-center gap-3">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="h-9 rounded-full px-6"
            variant="destructive"
          >
            {loading ? "กำลังลบ..." : "ยืนยัน"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-6"
            onClick={() => setOpen(false)}
          >
            ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ──────────────── Helper ──────────────── */
function formatTHB(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}
