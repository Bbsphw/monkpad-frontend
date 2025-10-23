// src/app/page.tsx

import SiteHeader from "@/components/site/site-header";
import HeroSection from "@/components/sections/home/hero-section";
import FeatureSection from "@/components/sections/home/feature-section";
import HowItWorks from "@/components/sections/home/how-it-works";
import TestimonialsSection from "@/components/sections/home/testimonials-section";
import CtaSection from "@/components/sections/home/cta-section";
import SiteFooter from "@/components/site/site-footer";

/**
 * ---------------------------------------
 * 🏠 Home Page (Public Landing)
 * ---------------------------------------
 * โครงสร้างหน้าแรกของเว็บ monkpad
 * - ใช้ layout แบบ header → main → footer
 * - แต่ละ section แยกเป็น component ย่อยเพื่อ maintain / reuse ง่าย
 * - หน้าแรกเป็น static (ไม่ต้องใช้ server component)
 *
 * SEO Tip: ควรให้แต่ละ section มี semantic tag ที่เหมาะสม เช่น
 *   - <header> สำหรับ Hero
 *   - <section aria-labelledby="..."> สำหรับแต่ละ feature
 *   - <footer> สำหรับ CTA / contact
 */

export default function Home() {
  return (
    <>
      {/* 🔝 Header: navigation / brand */}
      <SiteHeader />

      {/* 🧭 Main Content */}
      <main>
        {/* 🌟 Hero Section: ภาพรวม + CTA หลัก */}
        <HeroSection />

        {/* ⚙️ Features: จุดเด่นของระบบ */}
        <FeatureSection />

        {/* 🧩 How It Works: ขั้นตอนการใช้งาน OCR / ระบบ */}
        <HowItWorks />

        {/* 💬 Testimonials: รีวิวจากผู้ใช้ */}
        <TestimonialsSection />

        {/* 🚀 CTA Section: ปุ่มสมัคร / ทดลองใช้ */}
        <CtaSection />
      </main>

      {/* ⚓ Footer: ลิงก์ / ข้อมูลติดต่อ / ลิขสิทธิ์ */}
      <SiteFooter />
    </>
  );
}
