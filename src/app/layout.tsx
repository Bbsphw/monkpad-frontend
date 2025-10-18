// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monkpad",
  description: "จัดการรายรับรายจ่ายด้วย OCR อัตโนมัติ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ใช้ที่ build-time (safe สำหรับ <head/>)
  const BE = process.env.NEXT_PUBLIC_API_BASE_URL;

  return (
    <html lang="th">
      <head>
        {BE ? <link rel="dns-prefetch" href={BE} /> : null}
        {BE ? <link rel="preconnect" href={BE} crossOrigin="" /> : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster richColors position="top-center" />
        {children}
      </body>
    </html>
  );
}
