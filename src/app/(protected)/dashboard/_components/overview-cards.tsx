// src/app/(protected)/dashboard/_components/overview-cards.tsx

"use client";

import * as React from "react";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** 📊 ประเภทของค่าที่จะแสดง */
export type ValueType = "currency" | "number" | "percent";
/** 🎨 โทนสี accent สำหรับ card */
export type Accent = "success" | "danger" | "primary" | "info";

/**
 * 📦 โครงสร้างข้อมูลของแต่ละ Stat Metric
 * ------------------------------------------------
 * - id: ใช้เป็น key และ aria-labelledby
 * - title: ชื่อการ์ด
 * - value: ตัวเลขจริง
 * - valueType: รูปแบบการแสดงผล (เงิน, จำนวน, เปอร์เซ็นต์)
 * - icon: (optional) ไอคอน lucide-react
 * - accent: สีหลัก (กำหนด mood)
 */
export interface StatMetric {
  id: string;
  title: string;
  value: number;
  valueType: ValueType;
  icon?: React.ReactElement<LucideIcon>;
  accent?: Accent;
}

/** 💰 จัดรูปแบบค่าตามประเภท */
function formatValue(value: number, type: ValueType): string {
  switch (type) {
    case "currency":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 0,
      }).format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat("th-TH", {
        maximumFractionDigits: 0,
      }).format(value);
  }
}

/**
 * 🎨 ฟังก์ชัน map accent → สี + style ที่สอดคล้อง theme
 * ----------------------------------------------------------
 * ใช้ Tailwind classes + dark mode variant
 */
function accentCardClasses(accent: Accent | undefined): {
  card: string;
  iconWrap: string;
  title: string;
} {
  switch (accent) {
    case "success":
      return {
        card:
          "bg-gradient-to-b from-emerald-50 to-background dark:from-emerald-950/25 border-emerald-200/40 dark:border-emerald-900",
        iconWrap:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
        title: "text-emerald-900 dark:text-emerald-200",
      };
    case "danger":
      return {
        card:
          "bg-gradient-to-b from-rose-50 to-background dark:from-rose-950/25 border-rose-200/40 dark:border-rose-900",
        iconWrap:
          "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
        title: "text-rose-900 dark:text-rose-200",
      };
    case "info":
      return {
        card:
          "bg-gradient-to-b from-sky-50 to-background dark:from-sky-950/25 border-sky-200/40 dark:border-sky-900",
        iconWrap:
          "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300",
        title: "text-sky-900 dark:text-sky-200",
      };
    case "primary":
    default:
      return {
        card: "bg-gradient-to-b from-muted/40 to-background border",
        iconWrap: "bg-muted text-muted-foreground",
        title: "text-muted-foreground",
      };
  }
}

/**
 * 💳 Component: StatCard
 * ----------------------------------------------------------
 * แสดงการ์ดสรุปหนึ่งใบ เช่น "รายรับเดือนนี้"
 * - รองรับ accent / icon / valueType / A11y label
 */
interface StatCardProps {
  metric: StatMetric;
  className?: string;
  description?: string;
}

function StatCard({ metric, className, description }: StatCardProps) {
  const styles = accentCardClasses(metric.accent);

  return (
    <Card
      className={cn("rounded-2xl shadow-xs", styles.card, className)}
      role="region"
      aria-labelledby={`${metric.id}-title`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        {/* 🏷️ ชื่อการ์ด */}
        <CardTitle
          id={`${metric.id}-title`}
          className={cn("text-[0.9rem] font-medium", styles.title)}
        >
          {metric.title}
        </CardTitle>
        {/* 🖼️ ไอคอนตกแต่ง */}
        {metric.icon ? (
          <div className={cn("rounded-md p-1.5", styles.iconWrap)}>
            {metric.icon}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-1.5">
        {/* 🧮 ค่าแสดงผลหลัก */}
        <div className="text-3xl font-bold tabular-nums tracking-tight sm:text-[2rem]">
          {formatValue(metric.value, metric.valueType)}
        </div>
        {/* 🧾 รายละเอียดเพิ่มเติม (เช่น “เทียบเดือนที่แล้ว”) */}
        {description ? (
          <CardDescription className="text-[0.86rem]">
            {description}
          </CardDescription>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * 📈 Component: OverviewCards
 * -----------------------------------------------------
 * แสดงการ์ดสรุป 4 ใบในแดชบอร์ด
 * - รองรับ loading state (skeleton)
 * - ถ้าไม่มีข้อมูล → ใช้ fallback data
 */
export interface OverviewCardsProps {
  items?: StatMetric[];
  isLoading?: boolean;
  descriptions?: string[];
}

export function OverviewCards({
  items,
  isLoading = false,
  descriptions,
}: OverviewCardsProps) {
  // 🪣 ข้อมูล fallback สำหรับ skeleton หรือ initial state
  const fallback: StatMetric[] = [
    {
      id: "income",
      title: "รายรับเดือนนี้",
      value: 0,
      valueType: "currency",
      icon: <ArrowUpCircle className="h-5 w-5" />,
      accent: "success",
    },
    {
      id: "expense",
      title: "รายจ่ายเดือนนี้",
      value: 0,
      valueType: "currency",
      icon: <ArrowDownCircle className="h-5 w-5" />,
      accent: "danger",
    },
    {
      id: "balance",
      title: "ยอดคงเหลือเดือนนี้",
      value: 0,
      valueType: "currency",
      icon: <Wallet className="h-5 w-5" />,
      accent: "primary",
    },
    {
      id: "tx-count",
      title: "จำนวนธุรกรรมเดือนนี้",
      value: 0,
      valueType: "number",
      icon: <Receipt className="h-5 w-5" />,
      accent: "info",
    },
  ];

  const data = items?.length ? items : fallback;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 🟡 แสดง Skeleton ตอนโหลด */}
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={`sk-${i}`} className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-8 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded bg-muted/70" />
              </CardContent>
            </Card>
          ))
        : // 🟢 แสดง StatCard ปกติ
          data.map((m, idx) => (
            <StatCard key={m.id} metric={m} description={descriptions?.[idx]} />
          ))}
    </div>
  );
}