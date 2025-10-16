// src/app/(protected)/reports/_components/report-cards.tsx
"use client";

import * as React from "react";
import { ArrowDownCircle, ArrowUpCircle, Receipt, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type Summary = {
  income: number;
  expense: number;
  balance: number;
  transactions: number;
};

/* ---------- formatting ---------- */
function formatTH(value: number, type: "currency" | "number") {
  if (type === "currency") {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(
    value
  );
}

/* ---------- style meta ---------- */
const META: Record<
  keyof Summary,
  {
    label: string;
    type: "currency" | "number";
    Icon: React.FC<any>;
    bg: string;
    text: string;
    iconWrap: string;
    desc: string;
  }
> = {
  income: {
    label: "รายรับ",
    type: "currency",
    Icon: ArrowUpCircle,
    bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900",
    text: "text-emerald-900 dark:text-emerald-200",
    iconWrap:
      "bg-white/60 dark:bg-white/10 text-emerald-600 dark:text-emerald-300",
    desc: "รวมรายรับตามช่วงที่เลือก",
  },
  expense: {
    label: "รายจ่าย",
    type: "currency",
    Icon: ArrowDownCircle,
    bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900",
    text: "text-rose-900 dark:text-rose-200",
    iconWrap: "bg-white/60 dark:bg-white/10 text-rose-600 dark:text-rose-300",
    desc: "รวมรายจ่ายตามช่วงที่เลือก",
  },
  balance: {
    label: "ยอดคงเหลือ",
    type: "currency",
    Icon: Wallet,
    bg: "bg-muted/30 border-muted",
    text: "text-muted-foreground",
    iconWrap: "bg-white/60 dark:bg-white/10 text-muted-foreground",
    desc: "รายรับ - รายจ่าย",
  },
  transactions: {
    label: "จำนวนธุรกรรม",
    type: "number",
    Icon: Receipt,
    bg: "bg-sky-50 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-900",
    text: "text-sky-900 dark:text-sky-200",
    iconWrap: "bg-white/60 dark:bg-white/10 text-sky-600 dark:text-sky-300",
    desc: "จำนวนรายการธุรกรรม",
  },
};

/* ---------- single card ---------- */
function StatCard({ kind, value }: { kind: keyof Summary; value: number }) {
  const meta = META[kind];
  const Icon = meta.Icon;

  return (
    <div
      className={cn(
        "h-full rounded-2xl border p-4 shadow-xs transition-shadow duration-150 hover:shadow-sm",
        meta.bg
      )}
      role="region"
      aria-label={meta.label}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("text-sm font-medium", meta.text)}>
          {meta.label}
        </span>
        <span className={cn("rounded-md p-1.5", meta.iconWrap)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {/* ขนาดตัวเลขปรับตามพื้นที่ แต่ไม่ล้น */}
        <div
          className={cn("font-bold tabular-nums tracking-tight", meta.text)}
          style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.2rem)" }}
        >
          {formatTH(value, meta.type)}
        </div>
        <div className="text-xs text-muted-foreground">{meta.desc}</div>
      </div>
    </div>
  );
}

/* ---------- main (1-card per view carousel) ---------- */
export function ReportCards({
  summary,
  loading,
  error,
}: {
  summary?: Summary;
  loading?: boolean;
  error?: boolean;
}) {
  if (error)
    return (
      <div className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลสรุปได้</div>
    );

  // ระหว่างโหลด ใช้ placeholder ที่ “ขนาดเท่าการ์ดจริง” เพื่อไม่กระโดด
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[440px]">
        <div className="h-[140px] rounded-2xl border bg-muted/30 dark:bg-muted/10 animate-pulse" />
      </div>
    );
  }

  if (!summary)
    return <div className="text-sm text-muted-foreground">ไม่มีข้อมูล</div>;

  const order: (keyof Summary)[] = [
    "income",
    "expense",
    "balance",
    "transactions",
  ];

  return (
    // จำกัดความกว้างเพื่อให้สัดส่วนสวยในทุกจอ + จัดกลาง
    <div className="relative mx-auto w-full max-w-[220px] sm:max-w-[440px]">
      <Carousel
        // โชว์ทีละใบแบบ snap เหมือน native, ไม่ลากหลุดหลายใบ
        opts={{
          align: "center",
          loop: false,
          dragFree: false,
          skipSnaps: false,
        }}
        className="w-full"
      >
        {/* spacing ซ้ายด้วย -ml-4 และ item ใช้ pl-4 → ขอบพอดีเวลาสแนป */}
        <CarouselContent className="-ml-4 ">
          {order.map((k) => (
            <CarouselItem key={k} className="pl-4 basis-full">
              {/* fix ความสูงให้เท่ากันทุกสไลด์ */}
              <div className="h-[450px] sm:h-[180px]">
                <StatCard kind={k} value={summary[k]} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* ปุ่มเลื่อนวาง “นอกการ์ด” ไม่บังตัวเลข */}
        <CarouselPrevious className="-left-4 translate-x-[-4px]" />
        <CarouselNext className="-right-4 translate-x-[4px]" />
      </Carousel>
    </div>
  );
}
