// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/**
 * -------------------------------
 * 🧱 Root Layout (App Router)
 * -------------------------------
 * ใช้สำหรับครอบทุก route ในแอป (รวมทั้ง public และ protected)
 *
 * Responsibilities:
 * - กำหนด global font, theme, และ global style
 * - แสดง toast (จาก sonner) ที่ระดับ global
 * - ตั้งค่า metadata (SEO / title / description)
 * - ทำ preconnect / dns-prefetch ไปยัง backend เพื่อเร่ง network handshake
 */

/* 🎨 โหลด font จาก Google (ผ่าน next/font) */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* 🌐 ข้อมูลพื้นฐานของเว็บ (ใช้ได้ทั้งฝั่ง server และ headless SEO) */
export const metadata: Metadata = {
  title: "Monkpad",
  description: "จัดการรายรับรายจ่ายด้วย OCR อัตโนมัติ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ อ่านค่า API base URL จาก env (safe เฉพาะ NEXT_PUBLIC_)
  const BE = process.env.NEXT_PUBLIC_API_BASE_URL;

  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* ⚡️ DNS prefetch / preconnect ช่วยให้ fetch API เร็วขึ้น (ลด latency) */}
        {BE ? <link rel="dns-prefetch" href={BE} /> : null}
        {BE ? <link rel="preconnect" href={BE} crossOrigin="" /> : null}
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-background text-foreground`}
      >
        {/* 🌈 Toaster จาก Sonner (สำหรับ toast notification ทั่วระบบ) */}
        <Toaster richColors position="top-center" />

        {/* 🧩 เนื้อหาหลักของทุก route */}
        {children}
      </body>
    </html>
  );
}
