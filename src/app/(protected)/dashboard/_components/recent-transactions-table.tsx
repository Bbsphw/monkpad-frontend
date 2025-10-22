// // src/components/dashboard/recent-transactions-table.tsx

// "use client";

// import * as React from "react";
// import { format } from "date-fns";
// import { th } from "date-fns/locale";
// import { DateRange } from "react-day-picker";
// import {
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   Filter,
//   RefreshCcw,
//   Calendar as CalendarIcon,
//   Download,
// } from "lucide-react";

// import { Badge } from "@/components/ui/badge";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { cn } from "@/lib/utils";
// import type { RecentTxRow as Row } from "../_types/dashboard";

// export interface RecentTransactionsTableProps {
//   rows: Row[];
//   isLoading?: boolean;
//   className?: string;
// }

// /* ------------------------------ utils ------------------------------ */

// function formatCurrency(value: number): string {
//   return new Intl.NumberFormat("th-TH", {
//     style: "currency",
//     currency: "THB",
//     maximumFractionDigits: 0,
//   }).format(value);
// }

// function withinRange(dateISO: string, range?: DateRange): boolean {
//   if (!range?.from && !range?.to) return true;
//   const d = new Date(dateISO);
//   if (range?.from && !range?.to) return d >= startOfDay(range.from);
//   if (!range?.from && range?.to) return d <= endOfDay(range.to);
//   if (range?.from && range?.to)
//     return d >= startOfDay(range.from) && d <= endOfDay(range.to);
//   return true;
// }

// function startOfDay(d: Date): Date {
//   const t = new Date(d);
//   t.setHours(0, 0, 0, 0);
//   return t;
// }

// function endOfDay(d: Date): Date {
//   const t = new Date(d);
//   t.setHours(23, 59, 59, 999);
//   return t;
// }

// function exportCsv(filename: string, rows: Row[]): void {
//   const headers = ["id", "date", "type", "category", "amount", "note"];
//   const lines = rows.map((r) =>
//     [
//       r.id,
//       r.date,
//       r.type,
//       `"${r.category.replace(/"/g, '""')}"`,
//       r.amount.toString(),
//       r.note ? `"${r.note.replace(/"/g, '""')}"` : "",
//     ].join(",")
//   );
//   const csv = [headers.join(","), ...lines].join("\n");
//   const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.setAttribute("download", filename);
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);
// }

// /* ---------------------------- component --------------------------- */

// export function RecentTransactionsTable({
//   rows,
//   isLoading = false,
//   className,
// }: RecentTransactionsTableProps) {
//   const [typeFilter, setTypeFilter] = React.useState<
//     "all" | "income" | "expense"
//   >("all");
//   const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
//     undefined
//   );
//   const [pageSize, setPageSize] = React.useState<number>(10);
//   const [page, setPage] = React.useState<number>(0);

//   const filtered = React.useMemo(() => {
//     return rows
//       .filter((r) => (typeFilter === "all" ? true : r.type === typeFilter))
//       .filter((r) => withinRange(r.date, dateRange))
//       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
//   }, [rows, typeFilter, dateRange]);

//   const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const currentPage = Math.min(page, pageCount - 1);
//   const paged = React.useMemo(() => {
//     const start = currentPage * pageSize;
//     return filtered.slice(start, start + pageSize);
//   }, [filtered, currentPage, pageSize]);

//   const totalIncome = React.useMemo(
//     () =>
//       filtered
//         .filter((r) => r.type === "income")
//         .reduce((acc, r) => acc + r.amount, 0),
//     [filtered]
//   );
//   const totalExpense = React.useMemo(
//     () =>
//       filtered
//         .filter((r) => r.type === "expense")
//         .reduce((acc, r) => acc + r.amount, 0),
//     [filtered]
//   );
//   const net = totalIncome - totalExpense;

//   const showEmpty = !isLoading && filtered.length === 0;

//   function resetFilters(): void {
//     setTypeFilter("all");
//     setDateRange(undefined);
//     setPage(0);
//   }

//   function onExport(): void {
//     exportCsv(
//       `transactions_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
//       filtered
//     );
//   }

//   React.useEffect(() => {
//     setPage(0);
//   }, [typeFilter, dateRange, pageSize]);

//   return (
//     <Card
//       className={cn("overflow-hidden", className)}
//       role="region"
//       aria-label="ตารางรายการธุรกรรมล่าสุด"
//     >
//       <CardHeader className="pb-2">
//         <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
//           <div>
//             <CardTitle className="text-base sm:text-lg">
//               รายการธุรกรรมล่าสุด
//             </CardTitle>
//             <CardDescription>กรอง & ส่งออกข้อมูลได้ตามช่วงเวลา</CardDescription>
//           </div>

//           <div className="flex flex-wrap items-center gap-2">
//             <div className="flex items-center gap-2">
//               <Filter className="size-4 text-muted-foreground" />
//               <Select
//                 value={typeFilter}
//                 onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
//               >
//                 <SelectTrigger
//                   className="h-8 w-[140px]"
//                   aria-label="เลือกประเภท"
//                 >
//                   <SelectValue placeholder="ประเภท" />
//                 </SelectTrigger>
//                 <SelectContent align="end">
//                   <SelectItem value="all">ทั้งหมด</SelectItem>
//                   <SelectItem value="income">รายรับ</SelectItem>
//                   <SelectItem value="expense">รายจ่าย</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button variant="outline" size="sm" className="h-8">
//                   <CalendarIcon className="mr-2 size-4" />
//                   {dateRange?.from ? (
//                     dateRange.to ? (
//                       <>
//                         {format(dateRange.from, "d LLL yy", { locale: th })} –{" "}
//                         {format(dateRange.to, "d LLL yy", { locale: th })}
//                       </>
//                     ) : (
//                       format(dateRange.from, "d LLL yy", { locale: th })
//                     )
//                   ) : (
//                     <span>ช่วงวันที่</span>
//                   )}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="end">
//                 <Calendar
//                   mode="range"
//                   numberOfMonths={2}
//                   selected={dateRange}
//                   onSelect={setDateRange}
//                   initialFocus
//                   locale={th}
//                 />
//               </PopoverContent>
//             </Popover>

//             <Button
//               variant="ghost"
//               size="sm"
//               className="h-8"
//               onClick={resetFilters}
//             >
//               <RefreshCcw className="mr-2 size-4" />
//               รีเซ็ต
//             </Button>

//             <Button size="sm" className="h-8" onClick={onExport}>
//               <Download className="mr-2 size-4" />
//               Export CSV
//             </Button>
//           </div>
//         </div>
//       </CardHeader>

//       <div className="grid grid-cols-1 gap-2 border-t bg-muted/30 px-4 py-3 text-sm sm:grid-cols-3">
//         <div className="flex items-center justify-between sm:justify-start sm:gap-2">
//           <span className="text-muted-foreground">รวมรายรับ:</span>
//           <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
//             +{formatCurrency(totalIncome)}
//           </span>
//         </div>
//         <div className="flex items-center justify-between sm:justify-start sm:gap-2">
//           <span className="text-muted-foreground">รวมรายจ่าย:</span>
//           <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
//             -{formatCurrency(totalExpense)}
//           </span>
//         </div>
//         <div className="flex items-center justify-between sm:justify-start sm:gap-2">
//           <span className="text-muted-foreground">สุทธิ:</span>
//           <span
//             className={cn(
//               "font-semibold tabular-nums",
//               net >= 0
//                 ? "text-emerald-600 dark:text-emerald-400"
//                 : "text-rose-600 dark:text-rose-400"
//             )}
//           >
//             {net >= 0
//               ? `+${formatCurrency(net)}`
//               : `−${formatCurrency(Math.abs(net))}`}
//           </span>
//         </div>
//       </div>

//       <CardContent className="p-0">
//         {isLoading ? (
//           <div className="p-6 space-y-2">
//             <Skeleton className="h-5 w-1/3" />
//             <Skeleton className="h-12 w-full" />
//             <Skeleton className="h-12 w-full" />
//             <Skeleton className="h-12 w-full" />
//           </div>
//         ) : showEmpty ? (
//           <div className="p-8 text-center text-sm text-muted-foreground">
//             ไม่พบข้อมูลตามเงื่อนไขที่เลือก
//           </div>
//         ) : (
//           <Table>
//             <TableCaption>ข้อมูลจากตัวกรองปัจจุบัน</TableCaption>
//             <TableHeader className="bg-muted/40">
//               <TableRow>
//                 <TableHead className="w-[120px]">วันที่</TableHead>
//                 <TableHead>ประเภท</TableHead>
//                 <TableHead>หมวดหมู่</TableHead>
//                 <TableHead className="hidden sm:table-cell">
//                   รายละเอียด
//                 </TableHead>
//                 <TableHead className="text-right w-[140px]">
//                   จำนวนเงิน
//                 </TableHead>
//               </TableRow>
//             </TableHeader>

//             <TableBody>
//               {paged.map((r) => {
//                 const isIncome = r.type === "income";
//                 const amt = formatCurrency(r.amount);
//                 return (
//                   <TableRow
//                     key={r.id}
//                     className="hover:bg-muted/30 transition-colors"
//                   >
//                     <TableCell className="tabular-nums font-medium text-foreground/90">
//                       {new Date(r.date).toLocaleDateString("th-TH", {
//                         year: "2-digit",
//                         month: "short",
//                         day: "numeric",
//                       })}
//                     </TableCell>
//                     <TableCell>
//                       <Badge
//                         variant="outline"
//                         className={cn(
//                           "text-xs font-medium",
//                           isIncome
//                             ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
//                             : "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
//                         )}
//                       >
//                         {isIncome ? "รายรับ" : "รายจ่าย"}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="truncate max-w-[140px] sm:max-w-[180px]">
//                       {r.category}
//                     </TableCell>
//                     <TableCell className="hidden sm:table-cell max-w-[260px] truncate">
//                       {r.note ?? "-"}
//                     </TableCell>
//                     <TableCell
//                       className={cn(
//                         "text-right font-semibold tabular-nums",
//                         isIncome
//                           ? "text-emerald-600 dark:text-emerald-400"
//                           : "text-rose-600 dark:text-rose-400"
//                       )}
//                     >
//                       {isIncome ? `+${amt}` : `−${amt}`}
//                     </TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>
//         )}
//       </CardContent>

//       {!showEmpty && !isLoading && (
//         <div className="flex flex-col gap-3 border-t bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex items-center gap-2 text-sm">
//             แสดง
//             <Select
//               value={String(pageSize)}
//               onValueChange={(v) => setPageSize(Number(v))}
//             >
//               <SelectTrigger className="h-8 w-[80px]">
//                 <SelectValue placeholder={pageSize} />
//               </SelectTrigger>
//               <SelectContent>
//                 {[10, 20, 30, 50].map((n) => (
//                   <SelectItem key={n} value={String(n)}>
//                     {n}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             แถวต่อหน้า
//             <span className="ml-3 text-muted-foreground">
//               ทั้งหมด {filtered.length} รายการ
//             </span>
//           </div>

//           <div className="ml-auto flex items-center gap-1">
//             <Button
//               variant="outline"
//               size="icon"
//               className="h-8 w-8"
//               onClick={() => setPage(0)}
//               disabled={currentPage === 0}
//             >
//               <ChevronsLeft className="size-4" />
//             </Button>
//             <Button
//               variant="outline"
//               size="icon"
//               className="h-8 w-8"
//               onClick={() => setPage((p) => Math.max(0, p - 1))}
//               disabled={currentPage === 0}
//             >
//               <ChevronLeft className="size-4" />
//             </Button>
//             <div className="px-2 text-sm tabular-nums">
//               หน้า {currentPage + 1} / {pageCount}
//             </div>
//             <Button
//               variant="outline"
//               size="icon"
//               className="h-8 w-8"
//               onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
//               disabled={currentPage >= pageCount - 1}
//             >
//               <ChevronRight className="size-4" />
//             </Button>
//             <Button
//               variant="outline"
//               size="icon"
//               className="h-8 w-8"
//               onClick={() => setPage(pageCount - 1)}
//               disabled={currentPage >= pageCount - 1}
//             >
//               <ChevronsRight className="size-4" />
//             </Button>
//           </div>
//         </div>
//       )}
//     </Card>
//   );
// }

// src/app/(protected)/dashboard/_components/recent-transactions-table.tsx

"use client";

import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RefreshCcw,
  Calendar as CalendarIcon,
  Download,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { RecentRow as Row } from "../_types/dashboard";

/* ───────────────────────────── Utils ───────────────────────────── */

function asAmount(n: unknown): number {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(asAmount(value));
}

function withinRange(dateISO: string, range?: DateRange): boolean {
  if (!range?.from && !range?.to) return true;
  const d = new Date(dateISO);
  const start = range?.from ? new Date(range.from.setHours(0, 0, 0, 0)) : null;
  const end = range?.to ? new Date(range.to.setHours(23, 59, 59, 999)) : null;
  if (start && !end) return d >= start;
  if (!start && end) return d <= end;
  if (start && end) return d >= start && d <= end;
  return true;
}

function exportCsv(filename: string, rows: Row[]): void {
  const headers = ["id", "date", "type", "category", "amount", "note"];
  const lines = rows.map((r) =>
    [
      r.id,
      r.date,
      r.type,
      `"${(r.category ?? "-").replace(/"/g, '""')}"`,
      asAmount(r.amount).toString(),
      r.note ? `"${r.note.replace(/"/g, '""')}"` : "",
    ].join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────── Component ────────────────────────── */

export interface RecentTransactionsTableProps {
  rows: Row[];
  isLoading?: boolean;
  className?: string;
}

export function RecentTransactionsTable({
  rows,
  isLoading = false,
  className,
}: RecentTransactionsTableProps) {
  // 1) normalize ให้ amount เป็น number เสมอ
  const rowsNorm = React.useMemo<Row[]>(
    () =>
      (rows ?? []).map((r) => ({
        ...r,
        amount: asAmount(r.amount ?? r.value),
        category: r.category ?? r.tag ?? "-",
        date: r.date, // assume YYYY-MM-DD
      })),
    [rows]
  );

  const [typeFilter, setTypeFilter] = React.useState<
    "all" | "income" | "expense"
  >("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [page, setPage] = React.useState<number>(0);

  // 2) filter + sort (ล่าสุดก่อน)
  const filtered = React.useMemo(() => {
    return rowsNorm
      .filter((r) => (typeFilter === "all" ? true : r.type === typeFilter))
      .filter((r) => withinRange(r.date, dateRange))
      .sort((a, b) => {
        const ad = `${a.date} ${a.time ?? ""}`;
        const bd = `${b.date} ${b.time ?? ""}`;
        return bd.localeCompare(ad);
      });
  }, [rowsNorm, typeFilter, dateRange]);

  // 3) pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const paged = React.useMemo(() => {
    const start = currentPage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // 4) summary
  const totalIncome = React.useMemo(
    () =>
      filtered
        .filter((r) => r.type === "income")
        .reduce((s, r) => s + asAmount(r.amount), 0),
    [filtered]
  );
  const totalExpense = React.useMemo(
    () =>
      filtered
        .filter((r) => r.type === "expense")
        .reduce((s, r) => s + asAmount(r.amount), 0),
    [filtered]
  );
  const net = totalIncome - totalExpense;

  const showEmpty = !isLoading && filtered.length === 0;

  // reset page when filters changed
  React.useEffect(() => {
    setPage(0);
  }, [typeFilter, dateRange, pageSize, rowsNorm]);

  function resetFilters(): void {
    setTypeFilter("all");
    setDateRange(undefined);
    setPage(0);
  }

  function onExport(): void {
    exportCsv(
      `transactions_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
      filtered
    );
  }

  return (
    <Card
      className={cn("overflow-hidden", className)}
      role="region"
      aria-label="ตารางรายการธุรกรรมล่าสุด"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">
              รายการธุรกรรมล่าสุด
            </CardTitle>
            <CardDescription>กรอง & ส่งออกข้อมูลได้ตามช่วงเวลา</CardDescription>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
              >
                <SelectTrigger
                  className="h-8 w-[140px]"
                  aria-label="เลือกประเภท"
                >
                  <SelectValue placeholder="ประเภท" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="income">รายรับ</SelectItem>
                  <SelectItem value="expense">รายจ่าย</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarIcon className="mr-2 size-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "d LLL yy", { locale: th })} –{" "}
                        {format(dateRange.to, "d LLL yy", { locale: th })}
                      </>
                    ) : (
                      format(dateRange.from, "d LLL yy", { locale: th })
                    )
                  ) : (
                    <span>ช่วงวันที่</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                  locale={th}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={resetFilters}
            >
              <RefreshCcw className="mr-2 size-4" />
              รีเซ็ต
            </Button>

            <Button size="sm" className="h-8" onClick={onExport}>
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Summary bar */}
      <div className="grid grid-cols-1 gap-2 border-t bg-muted/30 px-4 py-3 text-sm sm:grid-cols-3">
        <div className="flex items-center justify-between sm:justify-start sm:gap-2">
          <span className="text-muted-foreground">รวมรายรับ:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-start sm:gap-2">
          <span className="text-muted-foreground">รวมรายจ่าย:</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            -{formatCurrency(totalExpense)}
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-start sm:gap-2">
          <span className="text-muted-foreground">สุทธิ:</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              net >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {net >= 0
              ? `+${formatCurrency(net)}`
              : `−${formatCurrency(Math.abs(net))}`}
          </span>
        </div>
      </div>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : showEmpty ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            ไม่พบข้อมูลตามเงื่อนไขที่เลือก
          </div>
        ) : (
          <Table>
            <TableCaption>ข้อมูลจากตัวกรองปัจจุบัน</TableCaption>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[120px]">วันที่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="hidden sm:table-cell">โน้ต</TableHead>
                <TableHead className="text-right w-[140px]">
                  จำนวนเงิน
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paged.map((r) => {
                const isIncome = r.type === "income";
                const amt = formatCurrency(asAmount(r.amount));
                return (
                  <TableRow
                    key={String(r.id)}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="tabular-nums font-medium text-foreground/90">
                      {new Date(r.date).toLocaleDateString("th-TH", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium",
                          isIncome
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        )}
                      >
                        {isIncome ? "รายรับ" : "รายจ่าย"}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate max-w-[140px] sm:max-w-[180px]">
                      {r.category ?? "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[260px] truncate">
                      {r.note ?? "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold tabular-nums",
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {isIncome ? `+${amt}` : `−${amt}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {!showEmpty && !isLoading && (
        <div className="flex flex-col gap-3 border-t bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            แสดง
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            แถวต่อหน้า
            <span className="ml-3 text-muted-foreground">
              ทั้งหมด {filtered.length} รายการ
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(0)}
              disabled={currentPage === 0}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="px-2 text-sm tabular-nums">
              หน้า {currentPage + 1} / {pageCount}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(pageCount - 1)}
              disabled={currentPage >= pageCount - 1}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
