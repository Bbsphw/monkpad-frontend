// components/site-header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import SiteLogo from "./site-logo";

export default function SiteHeader() {
  return (
    <header className="w-full border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link href="/">
            <SiteLogo href={null} />
          </Link>

          {/* Primary actions */}
          <nav aria-label="Primary" className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">เข้าสู่ระบบ</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">เริ่มใช้งานฟรี</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
