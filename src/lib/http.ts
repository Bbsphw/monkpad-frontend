// src/lib/http.ts

import { env } from "./env";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";

/**
 * 🧰 fetchJSON (server-first)
 * ใช้ได้ทั้งฝั่ง server / client:
 * - ถ้าฝั่ง server → แนบ Authorization จาก cookie ให้อัตโนมัติ (ถ้าไม่สั่ง noAuth)
 * - auto set JSON headers
 * - build URL ด้วย API_BASE_URL (ยกเว้น absolute)
 */

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

type FetchOpts = {
  authToken?: string | null; // override token (แทนที่ cookie)
  noAuth?: boolean; // ไม่ต้องแนบ auth header
  extraHeaders?: Record<string, string>; // header เพิ่มเติม
  absolute?: boolean; // treat 'path' เป็น absolute (ไม่ prepend base)
};

function isServer() {
  return typeof window === "undefined";
}

function resolveUrl(path: string, absolute?: boolean) {
  if (absolute) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!env.API_BASE_URL) return path;
  return `${env.API_BASE_URL}${path}`;
}

async function readAuthTokenFromCookie(): Promise<string | null> {
  // อ่าน token จาก cookie เฉพาะบน server เท่านั้น
  if (!isServer()) return null;
  try {
    const cookieStore = await nextCookies();
    const token = cookieStore.get("mp_token")?.value;
    return token ?? null;
  } catch {
    return null;
  }
}

// ดึง header จาก request ที่เข้ามา เพื่อ forward ต่อไปได้ (เช่น x-request-id)
export async function forwardableHeaders(
  keys: string[] = ["x-request-id", "accept-language"]
) {
  const h = new Headers();
  if (!isServer()) return h;
  try {
    const rqh = await nextHeaders();
    keys.forEach((k) => {
      const v = rqh.get(k);
      if (v) h.set(k, v);
    });
  } catch {
    /* ignore */
  }
  return h;
}

export async function fetchJSON<T = unknown>(
  path: string,
  init: JsonInit = {},
  opts: FetchOpts = {}
): Promise<T> {
  const url = resolveUrl(path, opts.absolute);

  // base headers
  const baseHeaders = new Headers();
  baseHeaders.set("accept", "application/json");

  const isJsonBody =
    init.body &&
    typeof init.body === "object" &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer);

  if (isJsonBody) baseHeaders.set("content-type", "application/json");

  // รวม headers: base → init.headers
  const mergedHeaders = new Headers(init.headers ?? {});
  for (const [k, v] of baseHeaders.entries()) {
    if (!mergedHeaders.has(k)) mergedHeaders.set(k, v);
  }

  // แนบ Authorization เว้นแต่สั่ง noAuth
  if (!opts.noAuth) {
    const cookieToken = await readAuthTokenFromCookie();
    const token = opts.authToken ?? cookieToken;
    if (token && !mergedHeaders.has("authorization")) {
      mergedHeaders.set("authorization", `Bearer ${token}`);
    }
  }

  // extra headers (เช่น forwarded headers)
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) {
      mergedHeaders.set(k, v);
    }
  }

  const body = isJsonBody ? JSON.stringify(init.body) : (init.body as any);

  const res = await fetch(url, {
    ...init,
    headers: mergedHeaders,
    body,
    credentials: "include",
    cache: "no-store",
  });

  // ตรวจ content-type เพื่อตีความผลลัพธ์/รวมข้อความ error
  const contentType = res.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    if (isJsonResponse) {
      try {
        const j = await res.json();
        if (j?.error?.message) message = j.error.message;
        else if (j?.message) message = j.message;
      } catch {}
    } else {
      try {
        const txt = await res.text();
        if (txt) message = txt;
      } catch {}
    }
    throw new Error(`Upstream ${res.status}: ${message}`);
  }

  if (!isJsonResponse) {
    // ปล่อยเป็น text เมื่อไม่ใช่ JSON (ดาวน์โหลดไฟล์/ข้อความ)
    return (await res.text()) as unknown as T;
  }
  return (await res.json()) as T;
}
