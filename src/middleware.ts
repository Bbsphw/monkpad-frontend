import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware (Edge) – ใช้สำหรับ:
 *  - ใส่ Security headers เบื้องต้น
 *  - Redirect ผู้ใช้ที่ยังไม่ล็อกอินออกจากหน้า protected
 *
 * หมายเหตุ: ชื่อกลุ่มเส้นทาง (route groups) อย่าง (auth) หรือ (protected)
 * จะไม่ปรากฏใน URL จริง ดังนั้นต้องระบุ path จริงที่ต้องการป้องกัน
 */

const PROTECTED_PATHS = [
  "/dashboard",
  "/transactions",
  "/reports",
  "/settings",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const url = nextUrl.clone();

  // 1) Block unauthenticated users from protected pages
  const token = cookies.get("mp_token")?.value || "";
  if (isProtectedPath(url.pathname) && !token) {
    url.pathname = "/sign-in";
    url.searchParams.set("next", req.nextUrl.pathname); // redirect back after login
    return NextResponse.redirect(url);
  }

  // 2) Add minimal security headers for all responses
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // CSP แบบผ่อนคลาย (แนะนำปรับตามโปรเจคจริง)
  // res.headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: http:");

  return res;
}

export const config = {
  // จับเฉพาะหน้าเพจและ API ของเรา (คุณปรับเพิ่มลดได้)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
