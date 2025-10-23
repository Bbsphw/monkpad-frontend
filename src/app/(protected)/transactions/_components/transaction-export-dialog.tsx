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
  // สถานะเปิด/ปิด Dialog + สถานะกำลังดาวน์โหลด (ป้องกันกดซ้ำ)
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ✅ ดึงค่าปัจจุบันจาก context (params/rows/pagination)
  // - rows: แถวที่ “ผ่านตัวกรองแล้ว” ตาม filter ปัจจุบัน (เหมือนในตาราง)
  // - params/pagination: มีไว้เผื่อขยายฟีเจอร์ (เช่น export เฉพาะหน้า, export ทั้งหมด)
  // const { params, rows, pagination } = useTransactionsContext();
  const { rows } = useTransactionsContext();

  // กด “ดาวน์โหลด CSV”
  async function handleExportCSV() {
    setDownloading(true);
    try {
      // 1) สร้าง header ของไฟล์ CSV (เรียงคอลัมน์แบบอ่านง่าย)
      const header = [
        "id",
        "date",
        "time",
        "type",
        "category",
        "amount",
        "note",
      ].join(",");

      // 2) แปลง rows → CSV lines
      // หมายเหตุ:
      // - มีการแทนที่ " ภายในข้อความด้วย "" (double-quote escaping แบบ CSV)
      // - มีการใส่ค่าตรง ๆ (ไม่มีการแยก paginate หรือ fetch เพิ่มเติม)
      // - การครอบด้วย "${v}" ตรงนี้ตั้งใจทำให้มี double-quotes ตอนมี comma (ตามโค้ดเดิม)
      //   แต่ปัจจุบันเป็น literal string; ถ้าจะให้ robust ควรหุ้มจริงด้วย "..." และ escape เต็มรูปแบบ (TODO)
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
            // ถ้าค่าเป็น string และมี comma → ครอบค่าเอาไว้ (ตามเจตนาเดิมในโค้ด)
            // หมายเหตุ: โค้ดเดิมใช้ literal string "${v}" ซึ่งไม่ได้แปลงเป็น template จริง ๆ
            // ช่วงนี้ยัง “ไม่แก้ไขพฤติกรรม” เพื่อคงผลลัพธ์เดิม (อาจมี edge cases เรื่อง comma/newline)
            .map((v) => (typeof v === "string" && v.includes(",") ? "${v}" : v))
            .join(",")
        )
        .join("\n");

      // 3) รวม header + body เป็น CSV string
      const csv = `${header}\n${body}`;

      // 4) สร้าง Blob → สร้าง object URL → สั่งดาวน์โหลด
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // ตั้งชื่อไฟล์แบบแนบวันที่ (ISO YYYY-MM-DD)
      a.download = `monkpad-transactions-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      // 5) ไม่ว่าผลจะสำเร็จ/ล้มเหลว → ปิดสถานะดาวน์โหลด + ปิด dialog
      setDownloading(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ปุ่ม trigger: ใช้ asChild เพื่อคงสไตล์ Button ของเรา */}
      <DialogTrigger asChild>
        <Button variant="outline">Export CSV</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>ส่งออกข้อมูล</DialogTitle>
          <DialogDescription>
            ดาวน์โหลดรายการธุรกรรมตามเงื่อนไขปัจจุบันเป็นไฟล์ .csv
          </DialogDescription>
        </DialogHeader>

        {/* แถบปุ่มล่าง: ยกเลิก / ดาวน์โหลด
            - disabled ตอนกำลังดาวน์โหลด เพื่อล็อก state และกันการกดซ้ำ */}
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
