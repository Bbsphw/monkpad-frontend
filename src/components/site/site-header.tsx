// src/components/site/site-header.tsx

"use client";

import Link from "next/link";
// import Image from "next/image"; // ❌ ไม่ได้ใช้ ลบออกเพื่อลด bundle
import { Button } from "@/components/ui/button";
import SiteLogo from "./site-logo";

/**
 * Header ส่วนบนของหน้า Landing:
 * - แบรนด์ (ลิงก์ไปหน้าหลัก)
 * - ปุ่มหลัก: เข้าสู่ระบบ / เริ่มใช้งานฟรี
 *
 * หมายเหตุ: ใช้ <nav aria-label="Primary"> เพื่อช่วย screen reader
 */
export default function SiteHeader() {
  return (
    <header className="w-full border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo — ใช้ Link ห่อ SiteLogo (SiteLogo ควรไม่สร้าง <a> ซ้ำ) */}
          <Link href="/" aria-label="หน้าแรก MonkPad" prefetch={false}>
            <SiteLogo href={null} />
          </Link>

          {/* Primary actions */}
          <nav aria-label="Primary" className="flex items-center gap-2">
            {/* ปุ่มลิงก์: ใช้ asChild เพื่อใช้ <a> ของ Next โดยคงสไตล์ปุ่ม */}
            <Button variant="ghost" asChild>
              <Link href="/sign-in" prefetch={false}>
                เข้าสู่ระบบ
              </Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up" prefetch={false}>
                เริ่มใช้งานฟรี
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
