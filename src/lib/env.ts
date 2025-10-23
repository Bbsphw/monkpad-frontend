// src/lib/env.ts

// Centralized, typed env access (SSR + edge-safe)

/**
 * ตัวช่วยอ่านค่า env ที่ “จำเป็น”
 * - คืน fallback ถ้ามี
 * - ถ้ายังว่าง: dev จะเตือนด้วย console.warn (prod เงียบ ๆ)
 * - ไม่ throw เพื่อไม่ให้ dev flow สะดุดตอนยังตั้งค่าไม่ครบ
 */
function required(name: string, value: string | undefined, fallback?: string) {
  const v = value ?? fallback;
  if (!v) {
    // ใน dev: แจ้งเตือนให้ไปตั้งค่า .env
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[env] Missing ${name}`);
    }
    // ส่งค่าว่างกลับ เพื่อให้ consumer เป็นผู้ตัดสินใจต่อว่าจะทำอย่างไร
    return "";
  }
  return v;
}

/**
 * คำนวณค่า APP_ORIGIN แบบฉลาด ๆ
 * ใช้เมื่อฝั่ง Server ต้อง “เรียก API ภายในแอปเอง” ด้วย absolute URL
 *
 * ลำดับความสำคัญ:
 * 1) APP_ORIGIN             → override ชัดเจนในโปรเจ็กต์นี้
 * 2) NEXT_PUBLIC_APP_URL    → เผื่อบางโปรเจ็กต์ใช้ตัวนี้อยู่แล้ว
 * 3) VERCEL_URL             → runtime domain บน Vercel (ต้องเติม https:// เอง)
 * 4) http://localhost:3000  → ค่า default ตอน dev
 */
const inferAppOrigin = () => {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const env = {
  /**
   * ⚙️ ใช้ในฝั่ง server (และอาจถูก import ใน client ได้ ระวังอย่าใส่ secret)
   * ตัวนี้ “ไม่ใช่ secret” แค่ origin ของแอปเราเอง
   */
  APP_ORIGIN: inferAppOrigin(),

  /**
   * 🔗 base URL ของ upstream FastAPI
   * - ใช้ required() เพื่อเตือนตอน dev ถ้ายังไม่ได้ตั้งค่า
   * - รองรับชื่อแปรสองแบบ: API_BASE_URL หรือ BACKEND_API_BASE_URL
   *   (เพื่อความเข้ากันได้กับ repo/infra เก่า)
   *
   * หมายเหตุ: ตัวนี้อาจถือว่า “sensitive” ได้ ขึ้นกับระบบ auth/โครงสร้างเน็ต
   * อย่า export ผ่าน NEXT_PUBLIC_* ถ้าไม่จำเป็น
   */
  API_BASE_URL: required(
    "API_BASE_URL",
    process.env.API_BASE_URL || process.env.BACKEND_API_BASE_URL
  ),
} as const;
