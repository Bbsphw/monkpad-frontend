// src/components/sections/home/testimonials-section.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

/** รีวิว/คำชมจากผู้ใช้ (ชื่อ/บทบาท/คอนเทนต์/เรตติ้ง) */
type Testimonial = {
  name: string;
  role: string;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatarUrl?: string;
};

/** ตัวอย่างรีวิว (ข้อมูล mock) */
const TESTIMONIALS = [
  {
    name: "สมชาย ใจดี",
    role: "นักศึกษา",
    content:
      "ใช้ MonkPad มา 3 เดือนแล้ว ช่วยจัดการเงินได้ดีมาก ไม่ต้องพิมพ์รายการเองแล้ว",
    rating: 5,
  },
  {
    name: "สุวรรณา การเงิน",
    role: "พนักงานบริษัท",
    content:
      "ตอนแรกไม่เชื่อว่า AI จะอ่านสลิปได้ แต่พอลองแล้วแม่นยำมาก แนะนำเลย",
    rating: 5,
  },
] as const satisfies ReadonlyArray<Testimonial>;

/** แถบดาว (อ่านได้ด้วย SR: บอกจำนวนดาวจาก 5) */
function Stars({ rating }: { rating: number }) {
  const max = 5;
  return (
    <div
      className="mb-4 flex items-center"
      aria-label={`ให้คะแนน ${rating} จาก ${max} ดาว`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < rating;
        return (
          <Star
            key={i}
            className={`h-5 w-5 ${
              filled
                ? "text-amber-500 fill-current"
                : "text-muted-foreground/40"
            }`}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{`ให้คะแนน ${rating} จาก ${max} ดาว`}</span>
    </div>
  );
}

/** การ์ดคำชม 1 ใบ (รูปโปรไฟล์ + เนื้อหา + ชื่อ/บทบาท) */
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <li className="list-none">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <Stars rating={t.rating} />
          <figure>
            <blockquote className="mb-4 text-pretty text-foreground">
              “{t.content}”
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {t.avatarUrl ? (
                  <AvatarImage src={t.avatarUrl} alt={t.name} />
                ) : null}
                <AvatarFallback aria-hidden="true">
                  {t.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-foreground">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        </CardContent>
      </Card>
    </li>
  );
}

/** Section รีวิวจากผู้ใช้: heading + กริดการ์ดรีวิว */
export default function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-title" className="bg-muted/30 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2
            id="testimonials-title"
            className="text-3xl font-bold text-foreground md:text-4xl"
          >
            ผู้ใช้งานพูดถึง MonkPad
          </h2>
        </div>

        <ul
          role="list"
          className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2"
        >
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </ul>
      </div>
    </section>
  );
}
