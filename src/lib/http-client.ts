// src/lib/http-client.ts

// ใช้ฝั่ง Client เป็นหลัก (เรียก internal route เช่น /api/...)
// - ตั้ง header JSON ให้อัตโนมัติ
// - รองรับ body แบบ JSON / FormData / Blob
// - รวมข้อความ error จาก payload เมื่อ upstream ตอบไม่ 2xx
// - ตัด no-explicit-any ด้วย unknown และ BodyInit ที่ชัดเจน

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

export async function fetchJSONClient<T = unknown>(
  path: string,
  init: JsonInit = {}
): Promise<T> {
  // ให้ path เป็น relative (เช่น /api/...) เพื่อพก cookie อัตโนมัติ
  const url =
    path.startsWith("http://") || path.startsWith("https://") ? path : path;

  // ---------- headers (JSON by default) ----------
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  const isJsonBody =
    init.body &&
    typeof init.body === "object" &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer);

  if (isJsonBody) headers.set("content-type", "application/json");

  // ---------- body typing ให้ชัดเจน (ตัด any) ----------
  const body: BodyInit | null = isJsonBody
    ? JSON.stringify(init.body)
    : (init.body as BodyInit | null | undefined) ?? null;

  const res = await fetch(url, {
    ...init,
    headers,
    body,
    credentials: "include",
    cache: "no-store",
  });

  // ---------- รวมข้อความ error จาก payload ----------
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
      // ถ้า parse JSON ไม่ได้ → ใช้ statusText ตามเดิม
    }
    throw new Error(`Request ${res.status}: ${msg}`);
  }

  // ---------- ตีความ response ----------
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  const text = await res.text();
  return text as unknown as T;
}
