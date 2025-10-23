// src/components/sections/home/feature-section.tsx

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import {
  Scan,
  BarChart3,
  Smartphone,
  Clock,
  Shield,
  TrendingUp,
} from "lucide-react";

/** โครงข้อมูลฟีเจอร์แต่ละข้อ (icon + title + description) */
type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

/** รายการฟีเจอร์ที่แสดงบนหน้า (อ่านง่าย/แก้ไขง่าย) */
const FEATURES = [
  {
    icon: Scan,
    title: "OCR อัตโนมัติ",
    description: "สแกนสลิปธนาคารและดึงข้อมูลอัตโนมัติด้วยเทคโนโลยี AI",
  },
  {
    icon: BarChart3,
    title: "รายงานครบถ้วน",
    description: "ดูสถิติรายรับ-รายจ่าย กราฟแนวโน้ม และวิเคราะห์การใช้จ่าย",
  },
  {
    icon: Smartphone,
    title: "ใช้งานง่าย",
    description: "อินเทอร์เฟซที่เข้าใจง่าย ใช้งานได้ทุกอุปกรณ์",
  },
  {
    icon: Clock,
    title: "ประหยัดเวลา",
    description: "ไม่ต้องพิมพ์รายการใหม่ ลดเวลาการบันทึกลง 90%",
  },
  {
    icon: Shield,
    title: "ปลอดภัย",
    description: "ข้อมูลเข้ารหัสและจัดเก็บอย่างปลอดภัย",
  },
  {
    icon: TrendingUp,
    title: "วิเคราะห์อัจฉริยะ",
    description: "แนะนำการจัดการเงินและเตือนการใช้จ่าย",
  },
] satisfies ReadonlyArray<Feature>;

/** การ์ดฟีเจอร์ 1 ใบ (A11y: ซ่อนไอคอนจาก screen reader ด้วย aria-hidden) */
function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <li className="list-none">
      <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader>
          {/* วงกลมไอคอนด้านบน */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>
            {/* แยก heading เพื่อ semantic ที่ดี */}
            <h3 className="text-xl">{title}</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ใช้ CardDescription เพื่อโทนสีรอง/อ่านสบาย */}
          <CardDescription className="text-base">{description}</CardDescription>
        </CardContent>
      </Card>
    </li>
  );
}

/** ส่วนแสดงฟีเจอร์ทั้งหมด (มี heading + grid การ์ด) */
export default function FeatureSection() {
  return (
    <section aria-labelledby="features-title" className="bg-muted/30 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ส่วนหัวของ section */}
        <div className="mb-16 text-center">
          <h2
            id="features-title"
            className="mb-4 text-3xl font-bold text-foreground md:text-4xl"
          >
            ทำไมต้องเลือก MonkPad?
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            เครื่องมือจัดการการเงินที่ทันสมัย ใช้งานง่าย และแม่นยำ
          </p>
        </div>

        {/* ตารางการ์ด (ใช้ role=list + <li> เพื่อ semantic) */}
        <ul
          role="list"
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </ul>
      </div>
    </section>
  );
}
