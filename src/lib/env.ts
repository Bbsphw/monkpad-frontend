// Centralized, typed env access (SSR + edge-safe)
function required(name: string, value: string | undefined, fallback?: string) {
  const v = value ?? fallback;
  if (!v) {
    // ไม่ throw เพื่อให้ dev ทำงานต่อได้ แค่เตือน
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[env] Missing ${name}`);
    }
    return "";
  }
  return v;
}

/**
 * APP_ORIGIN
 * - ใช้ใน server fetch เพื่อเรียก API ภายในแอปแบบ absolute
 * - ลำดับความสำคัญ:
 *   1) APP_ORIGIN (กำหนดเองใน .env.local)
 *   2) NEXT_PUBLIC_APP_URL (รองรับที่บางโปรเจ็กต์ใช้อยู่แล้ว)
 *   3) VERCEL_URL (ตอน deploy บน Vercel)
 *   4) http://localhost:3000 (dev)
 */
const inferAppOrigin = () => {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const env = {
  // ▶ ใช้ในฝั่ง server และ client (ระวังค่า secret อย่า export มา client)
  APP_ORIGIN: inferAppOrigin(),

  // ▶ upstream FastAPI
  API_BASE_URL: required(
    "API_BASE_URL",
    process.env.API_BASE_URL || process.env.BACKEND_API_BASE_URL
  ),
} as const;
