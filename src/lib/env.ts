import { z } from "zod";

/**
 * Validate and expose environment variables used by the frontend runtime.
 * Keep ONLY what you really need on the client; secrets must stay server-side.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Base URL ของ Backend (Nest/Express/Render)
  // ใช้ชื่อใดชื่อหนึ่งก็ได้: BACKEND_URL หรือ API_BASE_URL
  API_BASE_URL: z.string().url().optional(),
  BACKEND_URL: z.string().url().optional(),
});

const _raw = {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL: process.env.API_BASE_URL,
  BACKEND_URL: process.env.BACKEND_URL,
};

const parsed = EnvSchema.parse(_raw);

/**
 * สรุปให้เหลือค่าเดียว "API_BASE_URL" เพื่อเรียกง่าย ๆ ที่อื่น
 */
export const env = {
  NODE_ENV: parsed.NODE_ENV,
  API_BASE_URL: parsed.API_BASE_URL ?? parsed.BACKEND_URL ?? "",
};

if (!env.API_BASE_URL) {
  // เตือนช่วง dev ให้รู้ว่าลืมตั้งค่า
  if (env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "[env] API_BASE_URL/BACKEND_URL is not set. Some API calls may fail."
    );
  }
}
