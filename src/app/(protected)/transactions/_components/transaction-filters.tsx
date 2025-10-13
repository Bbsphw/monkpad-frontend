// app/(protected)/transactions/_components/transaction-filters.tsx
"use client";

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
import * as React from "react";
import { useTransactions } from "../_hooks/use-transactions";

/**
 * Layout:
 * lg: | search | type(160) | from(180) | to(180) | reset |
 * sm: 2 คอลัมน์, xs: 1 คอลัมน์
 */

type TxnType = "all" | "income" | "expense" | "transfer";
const TXN_TYPES: readonly TxnType[] = [
  "all",
  "income",
  "expense",
  "transfer",
] as const;
const isTxnType = (v: string): v is TxnType =>
  (TXN_TYPES as readonly string[]).includes(v);

export default function TransactionFilters(): React.JSX.Element {
  const { params, setFilter } = useTransactionsContext();
  const [openFrom, setOpenFrom] = React.useState<boolean>(false);
  const [openTo, setOpenTo] = React.useState<boolean>(false);

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
          <SelectTrigger aria-label="Filter by type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
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
          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
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
}): React.JSX.Element {
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
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
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

/** ---- Context hook to share useTransactions without prop drilling ---- */
const TxnCtx = React.createContext<ReturnType<typeof useTransactions> | null>(
  null
);

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const state = useTransactions();
  return <TxnCtx.Provider value={state}>{children}</TxnCtx.Provider>;
}

export function useTransactionsContext(): ReturnType<typeof useTransactions> {
  const ctx = React.useContext(TxnCtx);
  if (!ctx) {
    throw new Error(
      "useTransactionsContext must be used within TransactionsProvider"
    );
  }
  return ctx;
}
