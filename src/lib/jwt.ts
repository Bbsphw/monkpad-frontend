export type JwtPayload = Record<string, unknown> & {
  uid?: number;
  sub?: string;
  exp?: number;
};

function base64UrlToUint8Array(b64url: string): Uint8Array {
  // convert base64url -> base64
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  // pad
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);

  // prefer atob if available (Edge runtime มี)
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // Node fallback (Buffer อาจมี/อาจไม่มี)
  // @ts-ignore
  if (typeof Buffer !== "undefined") {
    // @ts-ignore
    return new Uint8Array(Buffer.from(b64, "base64"));
  }

  // สุดท้าย: polyfill เล็กๆ
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup: Record<string, number> = {};
  for (let i = 0; i < chars.length; i++) lookup[chars[i]] = i;

  const output: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const c of b64.replace(/=+$/, "")) {
    const val = lookup[c];
    if (val === undefined) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(output);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const bytes = base64UrlToUint8Array(parts[1]);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
