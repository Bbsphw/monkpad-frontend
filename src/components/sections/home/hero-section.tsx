// components/hero-section.tsx
"use client";

import Link from "next/link";
import { ArrowRight, FileUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b bg-background"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-24 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            🎉 เปิดตัวใหม่ — ใช้งานฟรี!
          </Badge>

          <h1
            id="hero-title"
            className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl mb-6"
          >
            จัดการ
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              รายรับรายจ่าย
            </span>
            <br className="hidden sm:block" />
            ด้วย
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              เทคโนโลยี OCR
            </span>
          </h1>

          <p className="text-pretty mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            อัปโหลดสลิปธนาคาร ปล่อยให้ AI ดึงข้อมูล
            และจัดการการเงินของคุณอย่างง่ายดาย และแม่นยำ ลดเวลาการบันทึกลงได้ราว
            90%
          </p>

          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              /* keep your custom styles if defined */ className="shadow-sm"
            >
              <Link href="/sign-up" prefetch={false}>
                เริ่มใช้งานฟรี
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in" prefetch={false}>
                <FileUp className="mr-2 h-5 w-5" aria-hidden="true" />
                ดูตัวอย่างการทำงาน
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats (use <dl>/<dt>/<dd> for accessibility) */}
        <div className="mx-auto mt-12 max-w-2xl sm:mt-16">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-4 text-center">
              <dt className="text-sm text-muted-foreground">ผู้ใช้งาน</dt>
              <dd className="mt-1 text-2xl font-semibold text-primary">
                1,000+
              </dd>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <dt className="text-sm text-muted-foreground">ความแม่นยำ</dt>
              <dd className="mt-1 text-2xl font-semibold text-emerald-600">
                99%
              </dd>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <dt className="text-sm text-muted-foreground">พร้อมใช้งาน</dt>
              <dd className="mt-1 text-2xl font-semibold text-amber-600">
                24/7
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
