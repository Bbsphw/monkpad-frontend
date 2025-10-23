// src/lib/http.ts

// fetchJSON (server-first) ใช้ได้ทั้ง server & client
// - server: auto แนบ Authorization จาก cookie "mp_token" (ถ้าไม่สั่ง noAuth)
// - client/server: ตั้ง JSON headers ให้, ต่อ base URL จาก env.API_BASE_URL
// - รวมข้อความ error จาก upstream อย่างสุภาพ
// - ตัด any ด้วย BodyInit typing ที่ชัดเจน

import { env } from "./env";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

type FetchOpts = {
  authToken?: string | null; // override token ถ้าต้องการ
  noAuth?: boolean; // ไม่แนบ Authorization
  extraHeaders?: Record<string, string>; // header เพิ่มเติม
  absolute?: boolean; // treat path เป็น absolute URL (ไม่ต่อ base)
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
  if (!isServer()) return null;
  try {
    const cookieStore = await nextCookies();
    return cookieStore.get("mp_token")?.value ?? null;
  } catch {
    return null;
  }
}

// Forward บาง headers จาก request ปัจจุบันไปยัง upstream ได้
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

  // ---------- base headers ----------
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

  // ---------- แนบ Authorization เว้นแต่สั่ง noAuth ----------
  if (!opts.noAuth) {
    const cookieToken = await readAuthTokenFromCookie();
    const token = opts.authToken ?? cookieToken;
    if (token && !mergedHeaders.has("authorization")) {
      mergedHeaders.set("authorization", `Bearer ${token}`);
    }
  }

  // header เพิ่มเติม
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) {
      mergedHeaders.set(k, v);
    }
  }

  // ---------- body typing ให้ชัดเจน (ตัด any) ----------
  const body: BodyInit | null = isJsonBody
    ? JSON.stringify(init.body)
    : (init.body as BodyInit | null | undefined) ?? null;

  const res = await fetch(url, {
    ...init,
    headers: mergedHeaders,
    body,
    credentials: "include",
    cache: "no-store",
  });

  // ---------- รวมข้อความ error ----------
  const contentType = res.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    if (isJsonResponse) {
      try {
        const j: unknown = await res.json();
        if (
          j &&
          typeof j === "object" &&
          "error" in j &&
          (j as { error?: unknown }).error &&
          typeof (j as { error: { message?: unknown } }).error === "object" &&
          typeof (j as { error: { message?: unknown } }).error!.message ===
            "string"
        ) {
          message = (j as { error: { message: string } }).error.message;
        } else if (
          j &&
          typeof (j as { message?: unknown }).message === "string"
        ) {
          message = (j as { message: string }).message;
        }
      } catch {
        // ignore
      }
    } else {
      try {
        const txt = await res.text();
        if (txt) message = txt;
      } catch {
        // ignore
      }
    }
    throw new Error(`Upstream ${res.status}: ${message}`);
  }

  // ---------- success ----------
  if (!isJsonResponse) {
    return (await res.text()) as unknown as T;
  }
  return (await res.json()) as T;
}
