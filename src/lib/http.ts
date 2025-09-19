// src/lib/http.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestJSONOptions<TBody> {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: TBody;
  timeoutMs?: number;
  retries?: number;
  cache?: RequestCache;
}

type JsonLike = Record<string, unknown> | unknown[] | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function fetchJSON<TIn, TOut>(
  url: string,
  {
    method = "GET",
    headers,
    body,
    timeoutMs = 15_000,
    retries = 0,
    cache = "no-store",
  }: RequestJSONOptions<TIn> = {}
): Promise<
  | { ok: true; status: number; data: TOut; raw: JsonLike | string }
  | { ok: false; status: number; error: string; raw?: JsonLike | string }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const attempt = async () => {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload: JsonLike | string = isJson
      ? await res.json().catch<null>(() => null)
      : await res.text().catch<string>(() => "");

    if (!res.ok) {
      let details = res.statusText;
      if (isJson && isRecord(payload)) {
        const msg = payload["message"] ?? payload["error"];
        if (typeof msg === "string" && msg.trim().length > 0) {
          details = msg;
        } else {
          try {
            details = JSON.stringify(payload);
          } catch {
            /* noop */
          }
        }
      } else if (
        !isJson &&
        typeof payload === "string" &&
        payload.trim().length > 0
      ) {
        details = payload;
      }

      return {
        ok: false as const,
        status: res.status,
        error: details,
        raw: payload,
      };
    }

    return {
      ok: true as const,
      status: res.status,
      data: (payload as TOut) ?? ({} as TOut),
      raw: payload,
    };
  };

  try {
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await attempt();
      } catch (err: unknown) {
        lastErr = err;
        if (i === retries) throw err;
      }
    }
    // should not reach
    throw lastErr;
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const message = err instanceof Error ? err.message : "Network error";
    return {
      ok: false as const,
      status: 0,
      error: isAbort ? "Request timed out" : message,
    };
  } finally {
    clearTimeout(timer);
  }
}
