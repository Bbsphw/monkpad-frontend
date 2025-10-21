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

/** ---- Context hook ---- */
const TxnCtx = React.createContext<ReturnType<typeof useTransactions> | null>(
  null
);

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useTransactions();
  return <TxnCtx.Provider value={state}>{children}</TxnCtx.Provider>;
}

export function useTransactionsContext() {
  const ctx = React.useContext(TxnCtx);
  if (!ctx) throw new Error("useTransactionsContext must be used in provider");
  return ctx;
}

type TxnType = "all" | "income" | "expense";
const TXN_TYPES = ["all", "income", "expense"] as const;
const isTxnType = (v: string): v is TxnType =>
  (TXN_TYPES as readonly string[]).includes(v as any);

export default function TransactionFilters() {
  const { params, setFilter } = useTransactionsContext();
  const [openFrom, setOpenFrom] = React.useState(false);
  const [openTo, setOpenTo] = React.useState(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_180px_180px_auto] gap-3 items-end">
      {/* Search */}
      <div className="sm:col-span-2 lg:col-span-1">
        <Input
          placeholder="ค้นหา (โน้ต/หมวด)…"
          value={params.q}
          onChange={(e) => setFilter({ q: e.target.value })}
          aria-label="ค้นหา"
        />
      </div>

      {/* Type */}
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

      {/* Date From */}
      <DateFilter
        label="จากวัน"
        value={params.dateFrom}
        open={openFrom}
        onOpenChange={setOpenFrom}
        onSelect={(iso) => setFilter({ dateFrom: iso })}
      />

      {/* Date To */}
      <DateFilter
        label="ถึงวัน"
        value={params.dateTo}
        open={openTo}
        onOpenChange={setOpenTo}
        onSelect={(iso) => setFilter({ dateTo: iso })}
      />

      {/* Reset */}
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

function DateFilter({
  label,
  value,
  open,
  onOpenChange,
  onSelect,
}: {
  label: string;
  value?: string;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSelect: (iso: string | undefined) => void;
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
          {value ? format(new Date(value), "yyyy-MM-dd") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(d) => onSelect(d ? format(d, "yyyy-MM-dd") : undefined)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
