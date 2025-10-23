// src/lib/http-server.ts

// ใช้ฝั่ง Server เท่านั้น (Route Handler / Server Action)
// - ต่อ URL ด้วย API_BASE_URL
// - แนบ Authorization จาก cookie "mp_token" โดยอัตโนมัติ (เว้นแต่สั่ง noAuth)
// - ตั้ง JSON headers ให้อัตโนมัติ
// - ตัด any ออกจาก body typing

import "server-only";
import { env } from "./env";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

function resolveUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${env.API_BASE_URL}${path}`;
}

async function readToken(): Promise<string | null> {
  const cookieStore = await nextCookies();
  return cookieStore.get("mp_token")?.value ?? null;
}

export async function fetchJSONServer<T = unknown>(
  path: string,
  init: JsonInit = {},
  { noAuth = false }: { noAuth?: boolean } = {}
): Promise<T> {
  const url = resolveUrl(path);

  // ---------- headers ----------
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  const isJsonBody =
    init.body &&
    typeof init.body === "object" &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer);

  if (isJsonBody) headers.set("content-type", "application/json");

  if (!noAuth) {
    const token = await readToken();
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  // forward บาง headers (optional)
  try {
    const h = await nextHeaders();
    const lang = h.get("accept-language");
    if (lang) headers.set("accept-language", lang);
  } catch {
    /* noop */
  }

  // ---------- body typing ----------
  const body: BodyInit | null = isJsonBody
    ? JSON.stringify(init.body)
    : (init.body as BodyInit | null | undefined) ?? null;

  const res = await fetch(url, {
    ...init,
    headers,
    body,
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    let msg = res.statusText;
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
        msg = (j as { error: { message: string } }).error.message;
      } else if (
        j &&
        typeof (j as { message?: unknown }).message === "string"
      ) {
        msg = (j as { message: string }).message;
      }
    } catch {
      // ignore
    }
    throw new Error(`Upstream ${res.status}: ${msg}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  const text = await res.text();
  return text as unknown as T;
}
