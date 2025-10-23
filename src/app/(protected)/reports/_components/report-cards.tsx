// src/app/(protected)/reports/_components/report-cards.tsx

"use client";

import * as React from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LucideIcon,
  Receipt,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Summary } from "../_types/reports";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/* ───────────────────────── formatting ─────────────────────────
 * รวมการฟอร์แมตตัวเลข/เงินไว้จุดเดียว:
 *  - ลดการซ้ำโค้ด (DRY)
 *  - ปรับรูปแบบ locale ได้ที่เดียวทั้งระบบ
 */
function formatTH(value: number, type: "currency" | "number") {
  if (type === "currency") {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0, // ยึด UX ที่อ่านง่ายสำหรับยอดรวม
    }).format(value);
  }
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(
    value
  );
}

/* ───────────────────────── style meta ─────────────────────────
 * Static meta ของการ์ดแต่ละชนิด:
 *  - แยก concerns "presentation" ออกจาก logic
 *  - ปรับธีม/สี/ไอคอนได้ง่าย ไม่แตะ component หลัก
 *  - key ของ META ต้อง match กับ keyof Summary เพื่อ type-safe
 */
const META: Record<
  keyof Summary,
  {
    label: string; // ชื่อบนการ์ด
    type: "currency" | "number"; // ฟอร์แมตตัวเลข
    Icon: LucideIcon; // ไอคอน lucide (as component)
    bg: string; // คลาสพื้นหลัง + เส้นขอบ (รองรับ dark)
    text: string; // คลาสข้อความหลัก
    iconWrap: string; // พื้นหลัง/สีไอคอน
    desc: string; // คำอธิบายสั้น ๆ ใต้ค่าหลัก
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
    desc: "รวมรายรับจากข้อมูลที่ดึงมา",
  },
  expense: {
    label: "รายจ่าย",
    type: "currency",
    Icon: ArrowDownCircle,
    bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900",
    text: "text-rose-900 dark:text-rose-200",
    iconWrap: "bg-white/60 dark:bg-white/10 text-rose-600 dark:text-rose-300",
    desc: "รวมรายจ่ายจากข้อมูลที่ดึงมา",
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
    desc: "จำนวนรายการทั้งหมดจาก payload",
  },
};

/* ───────────────────────── single card ─────────────────────────
 * การ์ดตัวเดียว (ใช้ META เพื่อคุมสไตล์)
 *  - ใช้ role/aria-label เพื่อเสริมการเข้าถึง (a11y)
 *  - ใช้ clamp() ปรับขนาดตัวเลขแบบ responsive
 */
function StatCard({ kind, value }: { kind: keyof Summary; value: number }) {
  const meta = META[kind];
  const Icon = meta.Icon;

  return (
    <div
      className={cn(
        "h-full rounded-2xl border p-4 shadow-xs transition-shadow duration-150 hover:shadow-sm",
        meta.bg // สีพื้นหลัง/เส้นขอบ จาก meta
      )}
      role="region"
      aria-label={meta.label}
    >
      {/* หัวการ์ด: label + icon ด้านขวา */}
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("text-sm font-medium", meta.text)}>
          {meta.label}
        </span>
        <span className={cn("rounded-md p-1.5", meta.iconWrap)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      {/* เนื้อหาหลัก: ค่าตัวเลขใหญ่ + คำอธิบาย */}
      <div className="flex flex-col gap-1">
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

/* ──────────────────────── main carousel (shadcn/ui) ────────────────────────
 * แสดงสรุปเป็นสไลด์การ์ด:
 *  - คอนเทนเนอร์จำกัดความกว้างเพื่อให้การ์ดสัดส่วนสวยเสมอ
 *  - ใช้ Carousel จาก shadcn/ui → UX ลื่น, สแนปทีละใบ
 *  - มีโครงสร้าง loading/error/empty ครบ
 */
export function ReportCards({
  summary,
  loading,
  error,
}: {
  summary?: Summary;
  loading?: boolean;
  error?: boolean;
}) {
  // Error state: แสดงข้อความสั้น กระชับ
  if (error)
    return (
      <div className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลสรุปได้</div>
    );

  // Loading state:
  // - ให้ placeholder ขนาดเท่าการ์ดจริง เพื่อหลีกเลี่ยง layout shift
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[440px]">
        <div className="h-[180px] rounded-2xl border bg-muted/30 dark:bg-muted/10 animate-pulse" />
      </div>
    );
  }

  // Empty state: ไม่มี summary
  if (!summary)
    return <div className="text-sm text-muted-foreground">ไม่มีข้อมูล</div>;

  // ลำดับของการ์ด: ควบคุมจาก array เดียว → ง่ายต่อการจัดเรียงในอนาคต
  const order: (keyof Summary)[] = [
    "income",
    "expense",
    "balance",
    "transactions",
  ];

  return (
    // จำกัด max-width ให้เหมาะกับทั้ง mobile/desktop + จัดกลาง
    <div className="relative mx-auto w-full max-w-[220px] sm:max-w-[440px]">
      <Carousel
        /* ตั้งค่า behavior ให้สแนปทีละใบ (ไม่ลากทีเดียวหลายใบ):
         * - align: 'center' → การ์ดอยู่กลางเสมอ
         * - dragFree: false → สแนปตาม slide
         * - loop: false → ไม่วนลูป (ปุ่มถัดไป/ก่อนหน้าอิงตามขอบจริง)
         */
        opts={{
          align: "center",
          loop: false,
          dragFree: false,
          skipSnaps: false,
        }}
        className="w-full"
      >
        {/* ใช้ -ml-4 ที่ content + pl-4 ในแต่ละ item:
            ทำให้ spacing ด้านซ้าย/ขวาพอดีเมื่อสแนป */}
        <CarouselContent className="-ml-4">
          {order.map((k) => (
            <CarouselItem key={k} className="pl-4 basis-full">
              {/* กำหนดความสูงตายตัวให้ทุกสไลด์เท่ากัน → ปุ่มไม่กระโดด */}
              <div className="h-[180px]">
                <StatCard kind={k} value={summary[k]} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* ปุ่มเลื่อน: วางนอกการ์ดเล็กน้อยเพื่อไม่บังตัวเลขกลางการ์ด */}
        <CarouselPrevious
          className="-left-4 translate-x-[-4px]"
          aria-label="ก่อนหน้า"
        />
        <CarouselNext
          className="-right-4 translate-x-[4px]"
          aria-label="ถัดไป"
        />
      </Carousel>
    </div>
  );
}
