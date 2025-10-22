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

/* ------------------------------------------------------------------
 * formatTHB: helper แปลงตัวเลขเป็นสกุลเงิน THB (style คงที่ทั้งระบบ)
 *  - ใช้ maximumFractionDigits: 0 เพื่อให้จำนวนเงิน “สะอาด” ใน UI
 *  - รองรับกรณี n falsy (0 / null / undefined)
 * ------------------------------------------------------------------ */
function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

/* =============================================================================
 * TransactionDeleteDialog
 * -----------------------------------------------------------------------------
 * Dialog ยืนยันการลบ “รายการธุรกรรม” แบบ action-first (กดไอคอนถัง → เปิดยืนยัน)
 *
 * UX หลัก:
 *  - ปุ่มไอคอนลบ (ghost) พร้อม Tooltip → คลิกเปิด Dialog
 *  - Dialog มีแถบสีแดงด้านบน + ไอคอนเตือน + รายละเอียดสรุปรายการ
 *  - ปุ่ม "ยืนยัน" → เรียก API ลบ → toast feedback → ปิด dialog → reload list
 *
 * A11y:
 *  - ใช้ <VisuallyHidden><DialogTitle/></VisuallyHidden> เพื่อใส่ title ให้ screen reader
 *  - ปุ่ม icon ใส่ aria-label ชัดเจน ("ลบรายการนี้")
 *
 * Data Sync:
 *  - หลังลบสำเร็จ:
 *      1) dispatch CustomEvent("mp:transaction:changed", { reason: "delete" })
 *         (note: ชื่ออีเวนต์นี้อาจต่างจากที่หน้าอื่นใช้ เช่น "mp:transactions:changed"
 *         แต่คงไว้ตามโค้ดต้นฉบับ ไม่แก้พฤติกรรม)
 *      2) เรียก reload() จาก useTransactionsContext เพื่อ revalidate SWR (in-memory)
 * ============================================================================= */
export default function TransactionDeleteDialog({
  row,
}: {
  row: Readonly<Transaction>; // ใช้ Readonly ป้องกันการแก้ไข props โดยไม่ตั้งใจ
}) {
  const { reload } = useTransactionsContext(); // hook กลางของหน้า /transactions
  const [open, setOpen] = React.useState<boolean>(false); // state คุม open/close dialog
  const [loading, setLoading] = React.useState<boolean>(false); // state คุมปุ่มยืนยันช่วงเรียก API

  /* ------------------------------------------------------------------
   * onConfirm: handler เมื่อกดยืนยันลบ
   *  - call DELETE /api/transactions/delete/:id
   *  - ใช้ toast จาก sonner เพื่อ feedback
   *  - dispatch CustomEvent เพื่อ broadcast ให้ส่วนอื่นทราบ
   *  - ปิด dialog + reload ตารางผ่าน context
   *  - ครอบด้วย try/catch + finally เพื่อให้ UI กลับสภาพเดิมเสมอ
   * ------------------------------------------------------------------ */
  const onConfirm = async (): Promise<void> => {
    try {
      setLoading(true);

      // 🔐 เรียก API internal (server route จะจัดการ token เอง)
      const res = await fetch(`/api/transactions/delete/${row.id}`, {
        method: "DELETE",
      });
      const js = await res.json().catch(() => null);

      // ❗ กรณี backend แจ้ง error → โยนเป็น Error เพื่อไปเข้า catch
      if (!res.ok || !js?.ok) {
        throw new Error(js?.error?.message || "ลบไม่สำเร็จ");
      }

      // ✅ สำเร็จ
      toast.success("ลบรายการสำเร็จ");

      // 📢 Broadcast event ให้หน้า/คอมโพเนนต์อื่นที่ฟังอยู่รู้ว่า data เปลี่ยน
      //    (หมายเหตุ: โค้ดส่วนอื่นบางจุดใช้ "mp:transactions:changed" แบบพหูพจน์
      //     ที่นี่คงไว้ตามเดิม "mp:transaction:changed" เพื่อไม่เปลี่ยนพฤติกรรม)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:transaction:changed", {
            detail: { reason: "delete" },
          })
        );
      }

      // ปิด dialog และสั่ง refresh data ในหน้า list
      setOpen(false);
      reload();
    } catch (e: unknown) {
      // 🧯 แปลงข้อความ error ให้เป็นมิตร
      const message = e instanceof Error ? e.message : "ลบไม่สำเร็จ";
      toast.error(message);
    } finally {
      // 🔄 คืนปุ่มจากสถานะ loading เสมอ
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ----------------------------------------------------------------
       * Trigger (ไอคอนถังขยะ)
       *  - ห่อด้วย TooltipProvider/Tooltip เพื่อ hint ผู้ใช้
       *  - ใช้ DialogTrigger asChild เพื่อให้ปุ่มเป็นตัวเปิด dialog โดยตรง
       *  - ปรับโทนสี hover เป็น destructive/10 ให้บอกนัยยะ “ลบ”
       *  - aria-label เพื่อ A11y
       * ---------------------------------------------------------------- */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
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
          {/* ต้องการ tooltip text จริง ให้เพิ่ม <TooltipContent> ได้ */}
          {/* <TooltipContent>ลบรายการ</TooltipContent> */}
        </Tooltip>
      </TooltipProvider>

      {/* ----------------------------------------------------------------
       * DialogContent:
       *  - ใช้ container แบบ “edge-to-edge” ในมือถือ (w-[92vw])
       *  - ตัด overflow + rounded สวยงาม
       *  - ใส่ DialogTitle แบบ VisuallyHidden เพื่อ screen reader
       * ---------------------------------------------------------------- */}
      <DialogContent className="w-[92vw] max-w-[440px] p-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        <VisuallyHidden>
          <DialogTitle>ยืนยันการลบรายการ</DialogTitle>
        </VisuallyHidden>

        {/* แถบสี destructive ด้านบน: visual cue ว่าเป็น action อันตราย */}
        <div className="h-12 w-full bg-destructive" />

        {/* เนื้อหา: ไอคอนเตือน + คำยืนยัน + แสดงข้อมูลย่อของรายการที่จะลบ */}
        <div className="flex flex-col items-center justify-center text-center px-6 pt-8 pb-4 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          {/* ใช้ Alert (variant destructive) เพื่อเน้นความเสี่ยง */}
          <Alert
            variant="destructive"
            className="border-0 bg-transparent p-0 flex flex-col items-center text-center"
          >
            <AlertTitle className="text-xl font-semibold text-foreground">
              ยืนยันการลบรายการ
            </AlertTitle>
            <AlertDescription className="mt-2 text-base flex flex-col items-center justify-center text-center">
              {/* แสดงหมวดหมู่ + จำนวนเงิน เพื่อให้ผู้ใช้มั่นใจก่อนลบ */}
              <span className="text-foreground/90">{row.category}</span>
              <span className="font-semibold text-destructive">
                {formatTHB(row.amount)}
              </span>
            </AlertDescription>
          </Alert>
        </div>

        {/* ปุ่ม action: “ยืนยัน” (destructive) และ “ยกเลิก” (outline)
           - ปุ่มยืนยัน disabled ระหว่าง loading เพื่อกันกดซ้ำ
           - ใช้วงกลม/rounded-full ให้สัมผัสนุ่มนวล */}
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
