// src/lib/http.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestJSONOptions<T> {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: T;
  timeoutMs?: number;
  retries?: number;
  cache?: RequestCache;
}

export async function fetchJSON<I, O>(
  url: string,
  {
    method = "GET",
    headers,
    body,
    timeoutMs = 15000,
    retries = 0,
    cache = "no-store",
  }: RequestJSONOptions<I> = {}
): Promise<{
  ok: boolean;
  status: number;
  data?: O;
  error?: string;
  raw?: unknown;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const attempt = async () => {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson
      ? await res.json().catch(() => null)
      : await res.text().catch(() => "");

    if (!res.ok) {
      // เก็บรายละเอียด error ชัดๆ
      const details = isJson
        ? (payload as any)?.message ||
          (payload as any)?.error ||
          JSON.stringify(payload)
        : String(payload);
      return {
        ok: false,
        status: res.status,
        error: details || res.statusText,
        raw: payload,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: (payload as O) ?? ({} as O),
      raw: payload,
    };
  };

  try {
    let lastErr: any;
    for (let i = 0; i <= retries; i++) {
      try {
        return await attempt();
      } catch (err) {
        lastErr = err;
        if (i === retries) throw err;
      }
    }
    throw lastErr;
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error:
        err?.name === "AbortError"
          ? "Request timed out"
          : err?.message || "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}
