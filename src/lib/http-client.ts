// src/lib/http.ts

import { env } from "./env";

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

export async function fetchJSONClient<T = unknown>(
  path: string,
  init: JsonInit = {}
): Promise<T> {
  // สำหรับ client ให้ยิงไปที่ internal API เช่น /api/dashboard/...
  // ถ้าส่ง URL เป็น absolute ก็ใช้ตามนั้น
  const url =
    path.startsWith("http://") || path.startsWith("https://") ? path : path; // ปล่อยให้เป็น relative (/api/...) จะพก cookie ให้เอง

  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  const isJsonBody =
    init.body &&
    typeof init.body === "object" &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer);

  if (isJsonBody) headers.set("content-type", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    body: isJsonBody ? JSON.stringify(init.body) : (init.body as any),
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.message || msg;
    } catch {}
    throw new Error(`Request ${res.status}: ${msg}`);
  }
  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? res.json() : res.text()) as any;
}
