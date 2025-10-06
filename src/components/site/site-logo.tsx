// // src/components/site/site-logo.tsx
// "use client";

// import Link from "next/link";
// import { EmojioneMonotoneMonkey } from "@/components/icons/emojione-monotone-monkey";
// import { cn } from "@/lib/utils";
// import type { ComponentType, MouseEventHandler, SVGProps } from "react";

// type SiteLogoProps = {
//   href?: string | null; // null = ไม่เป็นลิงก์
//   showIcon?: boolean; // แสดง/ซ่อนไอคอน
//   showWordmark?: boolean; // แสดง/ซ่อนข้อความ MONKPAD
//   size?: "sm" | "md" | "lg"; // ขนาดโลโก้
//   iconStyle?: "mark" | "plain"; // mark = กล่องพื้นหลัง, plain = ไอคอนล้วน
//   className?: string;
//   onClick?: MouseEventHandler<
//     HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement
//   >;
//   Icon?: ComponentType<SVGProps<SVGSVGElement>>; // ไอคอนกำหนดเอง
// };

// export default function SiteLogo({
//   href = "/",
//   showIcon = true,
//   showWordmark = true,
//   size = "md",
//   iconStyle = "mark",
//   className = "",
//   onClick,
//   Icon = EmojioneMonotoneMonkey,
// }: SiteLogoProps) {
//   const wordmarkSize =
//     size === "sm"
//       ? "text-lg"
//       : size === "lg"
//       ? "text-2xl md:text-3xl"
//       : "text-xl";
//   const iconBoxSize =
//     size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-8 w-8";
//   const iconSize =
//     size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

//   const containerClass = cn(
//     "inline-flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
//     className
//   );

//   const IconNode = showIcon ? (
//     iconStyle === "mark" ? (
//       <span
//         className={cn(
//           "inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground",
//           iconBoxSize
//         )}
//         aria-hidden="true"
//       >
//         <Icon className={iconSize} />
//       </span>
//     ) : (
//       <span
//         className="inline-flex items-center justify-center text-primary"
//         aria-hidden="true"
//       >
//         <Icon className={iconSize} />
//       </span>
//     )
//   ) : null;

//   const WordmarkNode = showWordmark ? (
//     <span className={cn("font-bold leading-none", wordmarkSize)}>
//       <span className="text-[#001845]">MON</span>
//       <span className="text-[#0466c8]">K</span>
//       <span className="text-[#979dac]">PAD</span>
//     </span>
//   ) : (
//     <span className="sr-only">MonkPad</span>
//   );

//   const ariaLabel = !showWordmark ? "กลับหน้าแรก MonkPad" : undefined;

//   // 1) เป็นลิงก์ (ค่าเริ่มต้น)
//   if (href) {
//     return (
//       <Link
//         href={href}
//         prefetch={false}
//         className={containerClass}
//         {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
//         onClick={onClick}
//       >
//         {IconNode}
//         {WordmarkNode}
//       </Link>
//     );
//   }

//   // 2) ไม่ใช่ลิงก์ แต่มี onClick → ปุ่มที่เข้าถึงได้ด้วยคีย์บอร์ด
//   if (onClick) {
//     return (
//       <button
//         type="button"
//         className={containerClass}
//         onClick={onClick}
//         {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
//       >
//         {IconNode}
//         {WordmarkNode}
//       </button>
//     );
//   }

//   // 3) ไม่ใช่ลิงก์และไม่มี onClick → สแปนธรรมดา
//   return (
//     <span
//       className={containerClass}
//       {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
//     >
//       {IconNode}
//       {WordmarkNode}
//     </span>
//   );
// }
// src/components/site/site-logo.tsx
"use client";

import Link from "next/link";
import { EmojioneMonotoneMonkey } from "@/components/icons/emojione-monotone-monkey";
import { cn } from "@/lib/utils";
import type { ComponentType, MouseEventHandler, SVGProps } from "react";

type SiteLogoProps = {
  href?: string | null; // null = ไม่เป็นลิงก์
  showIcon?: boolean; // แสดง/ซ่อนไอคอน
  showWordmark?: boolean; // แสดง/ซ่อนข้อความ MONKPAD
  size?: "sm" | "md" | "lg"; // ขนาดโลโก้
  iconStyle?: "mark" | "plain"; // mark = กล่องพื้นหลัง, plain = ไอคอนล้วน
  className?: string;
  onClick?: MouseEventHandler<
    HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement
  >;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>; // ไอคอนกำหนดเอง
};

export default function SiteLogo({
  href = "/",
  showIcon = true,
  showWordmark = true,
  size = "md",
  iconStyle = "mark",
  className = "",
  onClick,
  Icon = EmojioneMonotoneMonkey,
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
    "inline-flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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

  const WordmarkNode = showWordmark ? (
    <span className={cn("font-bold leading-none", wordmarkSize)}>
      <span className="text-[#001845]">MON</span>
      <span className="text-[#0466c8]">K</span>
      <span className="text-[#979dac]">PAD</span>
    </span>
  ) : (
    <span className="sr-only">MonkPad</span>
  );

  const ariaLabel = !showWordmark ? "กลับหน้าแรก MonkPad" : undefined;

  // 1) ไม่ใช่ลิงก์ (href = null) → สแปนธรรมดา
  if (href === null) {
    return (
      <span
        className={cn("inline-flex items-center gap-2", className)}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
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
      prefetch={false}
      className={containerClass}
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      onClick={onClick}
    >
      {IconNode}
      {WordmarkNode}
    </Link>
  );
}
