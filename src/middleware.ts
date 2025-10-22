// src/middleware.ts

// src/middleware.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * 🧩 Middleware (Edge Function)
 * ทำงานก่อนทุก request ที่ตรงกับ matcher — ใช้ได้ทั้งหน้าเพจและ API Routes
 *
 * หน้าที่หลัก:
 *  1. ใส่ HTTP Security Headers เบื้องต้น เช่น X-Frame-Options, Referrer-Policy
 *  2. Redirect ผู้ใช้ที่ยังไม่ได้ล็อกอินออกจากหน้า protected (auth guard)
 *
 * หมายเหตุ:
 *  - Next.js จะไม่รวมชื่อ “Route Group” (เช่น (auth), (protected)) ใน pathname จริง
 *    ดังนั้น path ที่ใช้ตรวจเช็กต้องเป็น path จริง เช่น `/dashboard`, `/transactions`
 */

// 🛡️ ระบุเส้นทาง (pages) ที่ต้องการป้องกันการเข้าถึงโดยผู้ไม่ได้ล็อกอิน
const PROTECTED_PATHS = [
  "/dashboard",
  "/transactions",
  "/reports",
  "/settings",
];

/**
 * Helper function:
 * ตรวจสอบว่า pathname ที่เข้ามาอยู่ในกลุ่ม protected หรือไม่
 */
function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * 🧠 Middleware function (Edge)
 * - ทำงานบน Edge runtime (เร็ว, lightweight)
 * - สามารถอ่าน cookie และ redirect ได้ทันที โดยไม่โหลดทั้งเพจ
 */
export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const url = nextUrl.clone();

  /* ---------------------------------------------------------------------- */
  /* 1) 🔐 Auth Guard – redirect ถ้ายังไม่มี token                          */
  /* ---------------------------------------------------------------------- */
  const token = cookies.get("mp_token")?.value || "";

  // ถ้าผู้ใช้พยายามเข้า path ที่ต้องล็อกอิน แต่ไม่มี token → redirect ไปหน้า sign-in
  if (isProtectedPath(url.pathname) && !token) {
    url.pathname = "/sign-in";
    // ส่ง query param next=... เพื่อให้ login เสร็จกลับมายังหน้าที่ค้างไว้ได้
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  /* ---------------------------------------------------------------------- */
  /* 2) 🧱 Security Headers – ป้องกันช่องโหว่พื้นฐานในทุก response       */
  /* ---------------------------------------------------------------------- */
  const res = NextResponse.next(); // ดำเนิน request ต่อไปตามปกติ

  // ป้องกัน Clickjacking (ไม่ให้หน้าเราถูก embed ใน iframe)
  res.headers.set("X-Frame-Options", "DENY");

  // ป้องกัน MIME sniffing (ให้ browser เคารพ Content-Type)
  res.headers.set("X-Content-Type-Options", "nosniff");

  // จำกัดข้อมูล Referrer header เมื่อเปลี่ยน origin (privacy-friendly)
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // (ตัวเลือก) Content Security Policy — ป้องกัน XSS / data injection
  // ❗ ปรับแต่งให้เหมาะกับโปรเจกต์จริงก่อนเปิดใช้
  // res.headers.set(
  //   "Content-Security-Policy",
  //   "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: http:"
  // );

  return res;
}

/**
 * 🧩 Matcher configuration
 * - บอก Next.js ว่า middleware ตัวนี้จะถูกเรียกกับเส้นทางใดบ้าง
 * - ข้ามไฟล์ static, image optimization, favicon, และ assets อื่น ๆ
 */
export const config = {
  matcher: [
    // ใช้ negative lookahead regex:
    // ตัด `_next/static`, `_next/image`, `favicon.ico`, `assets/*` ออก
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
