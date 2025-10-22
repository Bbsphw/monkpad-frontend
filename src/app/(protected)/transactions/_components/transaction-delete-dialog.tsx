// src/app/(protected)/transactions/_components/transaction-delete-dialog.tsx

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Transaction } from "../_types/transaction";
import { useTransactionsContext } from "./transaction-filters";

/* format เงินแบบ THB */
function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

/* ──────────────── Delete Confirm (icon trigger) ──────────────── */
export default function TransactionDeleteDialog({
  row,
}: {
  row: Readonly<Transaction>;
}) {
  const { reload } = useTransactionsContext();
  const [open, setOpen] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);

  const onConfirm = async (): Promise<void> => {
    try {
      setLoading(true);
      // ลบผ่าน API route (มี Bearer token ที่ฝั่ง server route แล้ว)
      const res = await fetch(`/api/transactions/delete/${row.id}`, {
        method: "DELETE",
      });
      const js = await res.json().catch(() => null);
      if (!res.ok || !js?.ok) {
        throw new Error(js?.error?.message || "ลบไม่สำเร็จ");
      }
      toast.success("ลบรายการสำเร็จ");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:transaction:changed", {
            detail: { reason: "delete" },
          })
        );
      }
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
          {/* ถ้าต้องการข้อความ tooltip ให้เปิดคอมเมนต์บรรทัดล่างได้ */}
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
}
