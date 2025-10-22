// src/components/sections/home/cta-section.tsx

"use client";

import Link from "next/link";
import { Users, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** บล็อก Call-to-Action: ชวนสมัคร/เข้าสู่ระบบ */
export default function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="py-20">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ใช้ gradient สร้างความโดดเด่น + border-0 ให้ดูเป็น hero-card */}
        <Card className="overflow-hidden border-0 bg-gradient-to-tr from-primary to-blue-600 text-primary-foreground shadow-lg">
          <CardContent className="px-6 py-16 text-center md:px-12">
            <h2
              id="cta-title"
              className="mb-4 text-balance text-3xl font-bold md:text-4xl"
            >
              พร้อมเริ่มต้นจัดการการเงินแล้วหรือยัง?
            </h2>

            <p className="text-pretty mx-auto mb-8 max-w-2xl text-lg opacity-90 md:text-xl">
              เข้าร่วมกับผู้ใช้กว่า{" "}
              <span className="font-semibold">1,000 คน</span> ที่เลือก MonkPad
              เพื่อจัดการการเงินอย่างมืออาชีพ
            </p>

            {/* ปุ่มคู่: สมัครใช้งาน / เข้าสู่ระบบ */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/sign-up" prefetch={false}>
                  <Users className="mr-2 h-5 w-5" aria-hidden="true" />
                  เริ่มใช้งานฟรีวันนี้
                </Link>
              </Button>

              <Button size="lg" variant="secondary" asChild>
                <Link href="/sign-in" prefetch={false}>
                  <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                  เข้าสู่ระบบ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
