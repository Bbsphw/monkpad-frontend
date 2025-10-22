// app/(protected)/transactions/_components/transaction-filters.tsx

"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useTransactions } from "../_hooks/use-transactions";

/** ----------------------------------------------------------------
 * Context: แชร์ state/operations จาก useTransactions ให้ลูก ๆ ทั้งหมด
 * - หลีกเลี่ยง prop drilling
 * - ทำให้ component อื่น ๆ reuse ฟังก์ชัน reload/setFilter/rows ได้สะดวก
 * ---------------------------------------------------------------- */
const TxnCtx = React.createContext<ReturnType<typeof useTransactions> | null>(
  null
);

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // รวม logic โหลด/กรอง/แบ่งหน้าไว้ใน hook เดียว
  const state = useTransactions();
  return <TxnCtx.Provider value={state}>{children}</TxnCtx.Provider>;
}

export function useTransactionsContext() {
  // hook ฝั่ง consumer: รับประกันว่าต้องถูกใช้ภายใต้ Provider เสมอ
  const ctx = React.useContext(TxnCtx);
  if (!ctx) throw new Error("useTransactionsContext must be used in provider");
  return ctx;
}

/** ----------------------------------------------------------------
 * Type ของตัวกรองประเภทธุรกรรม + type guard
 * - ใช้ literal union เพื่อลด error พิมพ์ผิด
 * - isTxnType ช่วยให้ TS รู้ว่าค่าเป็น TxnType จริงตอน onValueChange
 * ---------------------------------------------------------------- */
type TxnType = "all" | "income" | "expense";
const TXN_TYPES = ["all", "income", "expense"] as const;
const isTxnType = (v: string): v is TxnType =>
  (TXN_TYPES as readonly string[]).includes(v as any);

export default function TransactionFilters() {
  // รับ params ปัจจุบัน + setter จาก context
  const { params, setFilter } = useTransactionsContext();

  // เก็บสถานะเปิด/ปิดป็อปโอเวอร์ปฏิทินแยกกัน (A11y/Focus management ดีขึ้น)
  const [openFrom, setOpenFrom] = React.useState(false);
  const [openTo, setOpenTo] = React.useState(false);

  return (
    // ใช้ CSS grid กำหนด layout ให้ยืดหยุ่นกับหน้าจอหลายขนาด
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_180px_180px_auto] gap-3 items-end">
      {/* Search: กรองจาก note/category ด้วย debounced input ได้ในอนาคต (TODO ถ้าจำเป็น) */}
      <div className="sm:col-span-2 lg:col-span-1">
        <Input
          placeholder="ค้นหา (โน้ต/หมวด)…"
          value={params.q}
          onChange={(e) => setFilter({ q: e.target.value })}
          aria-label="ค้นหา"
        />
      </div>

      {/* Type: กรองประเภทธุรกรรม (all | income | expense) */}
      <div>
        <Select
          value={params.type}
          onValueChange={(v) => {
            if (isTxnType(v)) setFilter({ type: v });
          }}
        >
          <SelectTrigger aria-label="ประเภท">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="income">รายรับ</SelectItem>
            <SelectItem value="expense">รายจ่าย</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date From: เริ่มช่วงวันที่ (ISO yyyy-MM-dd) */}
      <DateFilter
        label="จากวัน"
        value={params.dateFrom}
        open={openFrom}
        onOpenChange={setOpenFrom}
        onSelect={(iso) => setFilter({ dateFrom: iso })}
      />

      {/* Date To: สิ้นสุดช่วงวันที่ (ISO yyyy-MM-dd) */}
      <DateFilter
        label="ถึงวัน"
        value={params.dateTo}
        open={openTo}
        onOpenChange={setOpenTo}
        onSelect={(iso) => setFilter({ dateTo: iso })}
      />

      {/* Reset: เคลียร์ทุกตัวกรองกลับค่าเริ่มต้น */}
      <div className="flex lg:justify-end">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() =>
            setFilter({
              q: "",
              type: "all",
              dateFrom: undefined,
              dateTo: undefined,
            })
          }
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          รีเซ็ต
        </Button>
      </div>
    </div>
  );
}

/** ----------------------------------------------------------------
 * DateFilter: ปุ่มเปิดปฏิทิน + popover
 * - เก็บค่าภายนอกเป็น string ISO เพื่อให้เสถียรกับ TimeZone/Serialize
 * - แสดงผลด้วย date-fns format ที่ฝั่ง UI
 * - initialFocus: ช่วยการใช้งานด้วยคีย์บอร์ด/A11y
 * ---------------------------------------------------------------- */
function DateFilter({
  label,
  value,
  open,
  onOpenChange,
  onSelect,
}: {
  label: string;
  value?: string; // เก็บใน state เป็น ISO string (เช่น "2025-01-31")
  open: boolean; // ควบคุมการเปิด/ปิด popover จากภายนอก
  onOpenChange: (b: boolean) => void;
  onSelect: (iso: string | undefined) => void; // เปลี่ยนค่ากลับไปยัง parent
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start",
            !value && "text-muted-foreground"
          )}
          aria-label={label}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {/* แสดง ISO string เป็น yyyy-MM-dd; ถ้าไม่มีค่า แสดง label */}
          {value ? format(new Date(value), "yyyy-MM-dd") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          // onSelect คืน Date | undefined → แปลงกลับเป็น ISO "yyyy-MM-dd"
          onSelect={(d) => onSelect(d ? format(d, "yyyy-MM-dd") : undefined)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
