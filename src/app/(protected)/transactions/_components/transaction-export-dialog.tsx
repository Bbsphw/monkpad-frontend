// app/(protected)/transactions/_components/transaction-export-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { TransactionService } from "../_services/transaction-service";
import { useTransactionsContext } from "./transaction-filters";

export default function TransactionExportDialog() {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { params } = useTransactionsContext();

  async function handleExportCSV() {
    setDownloading(true);
    try {
      const blob = await TransactionService.exportCSV(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monkpad-transactions-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Export</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ส่งออกข้อมูล</DialogTitle>
          <DialogDescription>
            บันทึก Transactions เป็นไฟล์ .csv
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleExportCSV} disabled={downloading}>
            {downloading ? "กำลังบันทึก…" : "ดาวน์โหลด CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
