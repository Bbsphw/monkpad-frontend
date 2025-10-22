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
import { useTransactionsContext } from "./transaction-filters";

export default function TransactionExportDialog() {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ✅ ดึงแถวทั้งหมดจาก cache แล้วกรองเอง (แบบเดียวกับตาราง)
  const { params, rows, pagination } = useTransactionsContext();

  async function handleExportCSV() {
    setDownloading(true);
    try {
      // รวมทั้งเพจทั้งหมด: ให้สร้างใหม่จาก rows+params อีกที (หรือไปดึงจาก SWR all ใน hook ก็ได้)
      const header = [
        "id",
        "date",
        "time",
        "type",
        "category",
        "amount",
        "note",
      ].join(",");
      const body = rows
        .map((r) =>
          [
            r.id,
            r.date,
            r.time ?? "",
            r.type,
            r.category.replace(/"/g, '""'),
            r.amount,
            (r.note ?? "").replace(/"/g, '""'),
          ]
            .map((v) => (typeof v === "string" && v.includes(",") ? "${v}" : v))
            .join(",")
        )
        .join("\n");
      const csv = `${header}\n${body}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

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
      <DialogTrigger>
        <Button variant="outline">Export CSV</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ส่งออกข้อมูล</DialogTitle>
          <DialogDescription>
            ดาวน์โหลดรายการธุรกรรมตามเงื่อนไขปัจจุบันเป็นไฟล์ .csv
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
