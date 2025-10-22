// src/lib/http-server.ts

import "server-only";
import { env } from "./env";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

function resolveUrl(path: string) {
  // ฝั่ง Server: ถ้าเป็น relative ให้ prepend ด้วย BACKEND API BASE
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${env.API_BASE_URL}${path}`;
}

async function readToken(): Promise<string | null> {
  // อ่าน token จาก cookie (ชื่อ mp_token)
  const cookieStore = await nextCookies();
  return cookieStore.get("mp_token")?.value ?? null;
}

export async function fetchJSONServer<T = unknown>(
  path: string,
  init: JsonInit = {},
  { noAuth = false }: { noAuth?: boolean } = {}
): Promise<T> {
  const url = resolveUrl(path);

  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  const isJsonBody =
    init.body &&
    typeof init.body === "object" &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer);

  if (isJsonBody) headers.set("content-type", "application/json");

  // แนบ Authorization: Bearer <token> อัตโนมัติ (ถ้าไม่ปิด noAuth)
  if (!noAuth) {
    const token = await readToken();
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  // forward header บางตัว (เช่น accept-language) ไปยัง upstream
  try {
    const h = await nextHeaders();
    const lang = h.get("accept-language");
    if (lang) headers.set("accept-language", lang);
  } catch {
    /* noop */
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body: isJsonBody ? JSON.stringify(init.body) : (init.body as any),
    cache: "no-store",
    credentials: "include",
  });

  // รวมข้อความผิดพลาดจาก upstream
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.message || msg;
    } catch {}
    throw new Error(`Upstream ${res.status}: ${msg}`);
  }

  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? res.json() : res.text()) as any;
}
