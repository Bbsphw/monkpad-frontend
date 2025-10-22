// src/lib/jwt.ts

// ยูทิลสำหรับอ่าน payload ของ JWT (ไม่ verify signature)
// - ใช้เฉพาะบน FE/BE เพื่อ "อ่าน" claims เบา ๆ
// - ตัด any: ใช้ generic ที่ default เป็น unknown

export type JwtLikePayload = Record<string, unknown> & {
  sub?: number | string; // บางระบบเก็บ user id ใน sub
  id?: number | string; // หรือ id
  user_id?: number | string;
  username?: string;
  email?: string;
  exp?: number; // expire (sec)
  iat?: number; // issued at (sec)
};

export function decodeJwt<T = unknown>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    // รองรับ base64url → base64
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** ถอด JWT โดยระบุผลลัพธ์เป็น JwtLikePayload ให้ตายตัว */
export function decodeJwtNoVerify(token: string): JwtLikePayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64").toString("utf8");
    const payload = JSON.parse(json) as unknown;
    return (payload ?? null) as JwtLikePayload | null;
  } catch {
    return null;
  }
}

/** ดึง userId จาก payload โดยรองรับหลาย key (sub / id / user_id) */
export function userIdFromPayload(p?: JwtLikePayload | null): number | null {
  if (!p) return null;
  const raw = (p.sub ?? p.id ?? p.user_id) as string | number | undefined;
  if (raw == null) return null;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(n) ? (n as number) : null;
}
