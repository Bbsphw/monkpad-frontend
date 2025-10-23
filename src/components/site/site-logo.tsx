// src/components/site/site-logo.tsx

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentType, MouseEventHandler, SVGProps } from "react";
import { EmojioneMonotoneMonkey } from "../icons/emojione-monotone-monkey";

type SiteLogoProps = {
  /** null = ไม่เป็นลิงก์ */
  href?: string | URL | null;
  /** ควบคุม prefetch ของ next/link (ดีฟอลต์ false เพื่อลดโหลดหน้า land) */
  prefetch?: boolean;
  /** แสดง/ซ่อนไอคอน */
  showIcon?: boolean;
  /** แสดง/ซ่อนข้อความ MONKPAD */
  showWordmark?: boolean;
  /** ขนาดโลโก้ */
  size?: "sm" | "md" | "lg";
  /** mark = มีพื้นหลัง, plain = ไอคอนล้วน */
  iconStyle?: "mark" | "plain";
  className?: string;
  onClick?: MouseEventHandler<
    HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement
  >;
  /** ไอคอนกำหนดเอง */
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** กำหนด aria-label เอง (เช่น “กลับหน้าแรก MonkPad”) */
  ariaLabel?: string;
};

export default function SiteLogo({
  href = "/",
  prefetch = false,
  showIcon = true,
  showWordmark = true,
  size = "md",
  iconStyle = "mark",
  className = "",
  onClick,
  Icon = EmojioneMonotoneMonkey,
  ariaLabel,
}: SiteLogoProps) {
  const wordmarkSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
      ? "text-2xl md:text-3xl"
      : "text-xl";

  const iconBoxSize =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-8 w-8";
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  const containerClass = cn(
    "inline-flex items-center gap-2",
    href
      ? // โฟกัสริงเฉพาะกรณีเป็นลิงก์โต้ตอบได้
        "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      : "",
    className
  );

  const IconNode = showIcon ? (
    iconStyle === "mark" ? (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground",
          iconBoxSize
        )}
        aria-hidden="true"
      >
        <Icon className={iconSize} />
      </span>
    ) : (
      <span
        className="inline-flex items-center justify-center text-primary"
        aria-hidden="true"
      >
        <Icon className={iconSize} />
      </span>
    )
  ) : null;

  // ใช้สีด้วย class ของธีม แทน hex ตายตัว เพื่อรองรับ light/dark
  const WordmarkNode = showWordmark ? (
    <span className={cn("font-bold leading-none", wordmarkSize)}>
      <span className="text-foreground">MON</span>
      <span className="text-primary">K</span>
      <span className="text-muted-foreground">PAD</span>
    </span>
  ) : (
    <span className="sr-only">MonkPad</span>
  );

  const computedAria =
    ariaLabel ?? (!showWordmark ? "กลับหน้าแรก MonkPad" : undefined);

  // 1) ไม่ใช่ลิงก์ (href = null) → สแปนธรรมดา
  if (href === null) {
    return (
      <span
        className={containerClass}
        {...(computedAria ? { "aria-label": computedAria } : {})}
      >
        {IconNode}
        {WordmarkNode}
      </span>
    );
  }

  // 2) เป็นลิงก์ปกติ
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={containerClass}
      {...(computedAria ? { "aria-label": computedAria } : {})}
      onClick={onClick}
    >
      {IconNode}
      {WordmarkNode}
    </Link>
  );
}
