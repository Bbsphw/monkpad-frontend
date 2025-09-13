// components/site-header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  return (
    <header className="w-full border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            aria-label="กลับหน้าแรก MONKPAD"
          >
            <Image
              src="/icons/emojione-monotone--monkey.svg"
              alt="" // decorative (wordmark provides the name)
              width={24}
              height={24}
              className="h-6 w-6"
              aria-hidden="true"
            />
            <span className="text-xl font-bold leading-none">
              <span className="text-[#001845]">MON</span>
              <span className="text-[#0466c8]">K</span>
              <span className="text-[#979dac]">PAD</span>
            </span>
          </Link>

          {/* Primary actions */}
          <nav aria-label="Primary" className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/sign-in">เข้าสู่ระบบ</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">เริ่มใช้งานฟรี</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
