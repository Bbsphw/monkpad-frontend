// src/components/site/site-logo.tsx
"use client";

import Link from "next/link";
import { EmojioneMonotoneMonkey } from "@/components/icons/emojione-monotone-monkey";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  href?: string | null; // null = ไม่เป็นลิงก์
  showIcon?: boolean; // แสดง/ซ่อนไอคอน
  showWordmark?: boolean; // แสดง/ซ่อนข้อความ MONKPAD
  size?: "sm" | "md" | "lg"; // ขนาดโลโก้
  iconStyle?: "mark" | "plain"; // mark = มีพื้นหลังกล่อง, plain = ไอคอนล้วน
  className?: string;
};

export default function SiteLogo({
  href = "/",
  showIcon = true,
  showWordmark = true,
  size = "md",
  iconStyle = "mark",
  className = "",
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

  const IconNode = showIcon ? (
    iconStyle === "mark" ? (
      // กล่องพื้นหลัง: ใช้ text-primary-foreground ให้คอนทราสต์กับ bg-primary
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground",
          iconBoxSize
        )}
        aria-hidden="true"
      >
        <EmojioneMonotoneMonkey className={iconSize} />
      </span>
    ) : (
      // ไอคอนล้วน: ให้สีตามธีม/แบรนด์
      <span
        className="inline-flex items-center justify-center text-primary"
        aria-hidden="true"
      >
        <EmojioneMonotoneMonkey className={iconSize} />
      </span>
    )
  ) : null;

  const WordmarkNode = showWordmark ? (
    <span className={cn("font-bold leading-none", wordmarkSize)}>
      <span className="text-[#001845]">MON</span>
      <span className="text-[#0466c8]">K</span>
      <span className="text-[#979dac]">PAD</span>
    </span>
  ) : (
    <span className="sr-only">MonkPad</span>
  );

  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {IconNode}
      {WordmarkNode}
    </span>
  );

  // ถ้ามีข้อความมองเห็นอยู่แล้ว ไม่ต้องใส่ aria-label ซ้ำ
  const linkAriaLabel = !showWordmark ? "กลับหน้าแรก MonkPad" : undefined;

  return href ? (
    <Link
      href={href}
      prefetch={false}
      {...(linkAriaLabel ? ({ "aria-label": linkAriaLabel } as any) : {})}
    >
      {content}
    </Link>
  ) : (
    content
  );
}
