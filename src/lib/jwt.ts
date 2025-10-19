// src/lib/jwt.ts
export type JwtLikePayload = Record<string, unknown> & {
  sub?: number | string;
  id?: number | string;
  user_id?: number | string;
  username?: string;
  email?: string;
  exp?: number;
  iat?: number;
};

export function decodeJwt<T = any>(token: string): T | null {
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

/** ถอด JWT โดยไม่ verify ลายเซ็น (เพื่ออ่าน payload ใช้ภายในเท่านั้น) */
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

/** ดึง userId จาก payload: รองรับ sub / id / user_id */
export function userIdFromPayload(p?: JwtLikePayload | null): number | null {
  if (!p) return null;
  const raw = (p.sub ?? p.id ?? p.user_id) as string | number | undefined;
  if (raw == null) return null;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(n) ? (n as number) : null;
}
