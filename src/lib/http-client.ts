// src/lib/http-client.ts

import { env } from "./env";

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

export async function fetchJSONClient<T = unknown>(
  path: string,
  init: JsonInit = {}
): Promise<T> {
  // ฝั่ง Client: อนุญาตทั้ง relative (/api/...) และ absolute (http/https)
  // - ใช้ relative เพื่อพก cookie อัตโนมัติ (credentialed)
  const url =
    path.startsWith("http://") || path.startsWith("https://") ? path : path;

  // ใส่ accept: application/json ไว้ก่อน
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  // ตรวจสภาพ body → ถ้าเป็น object (ไม่ใช่ FormData/Blob/ArrayBuffer) ค่อยแปะ content-type
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
    credentials: "include", // ให้ส่ง cookie ไปด้วย (สำคัญเวลาคุยกับ /api/*)
    cache: "no-store", // ไม่ cached
  });

  // รวม error message จาก body ถ้าทำได้ → โยน Error เดียวกันให้ผู้ใช้ไปจัดการ
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.message || msg;
    } catch {}
    throw new Error(`Request ${res.status}: ${msg}`);
  }

  // ตอบกลับเป็น JSON ถ้า content-type เป็น JSON, ไม่งั้นเป็น text
  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? res.json() : res.text()) as any;
}
