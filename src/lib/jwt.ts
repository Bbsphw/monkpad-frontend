// src/lib/jwt.ts

export type JwtLikePayload = Record<string, unknown> & {
  sub?: number | string; // มักเป็น user id
  id?: number | string; // เผื่อบางระบบใช้ id แทน
  user_id?: number | string;
  username?: string;
  email?: string;
  exp?: number; // expire timestamp (sec)
  iat?: number; // issued at (sec)
};

export function decodeJwt<T = any>(token: string): T | null {
  // ถอด JWT (ไม่ verify signature) → ใช้อ่าน payload อย่างเดียว
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** เหมือนด้านบน แต่คง type เป็น JwtLikePayload ให้ชัดเจน */
export function decodeJwtNoVerify(token: string): JwtLikePayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64").toString("utf8");
    const payload = JSON.parse(json);
    return payload ?? null;
  } catch {
    return null;
  }
}

/** ดึง userId จาก payload: รองรับหลาย key (sub/id/user_id) */
export function userIdFromPayload(p?: JwtLikePayload | null): number | null {
  if (!p) return null;
  const raw = (p.sub ?? p.id ?? p.user_id) as string | number | undefined;
  if (raw == null) return null;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(n) ? (n as number) : null;
}
