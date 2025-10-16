// src/lib/http.ts
import { env } from "./env";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";

/**
 * A thin JSON (and text) fetcher for server-side usage (Route Handlers, Server Actions).
 * Features:
 *  - Base URL prepend (env.API_BASE_URL)
 *  - Auto JSON headers
 *  - Auto attach Authorization from cookie "mp_token" (server context; Next.js 15: cookies() is async)
 *  - Override headers/token per-call
 *  - Unified error throwing with useful messages
 */

type JsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown; // object will be JSON.stringified; FormData/Blob will be passed through
  headers?: HeadersInit; // will be merged with defaults
};

type FetchOpts = {
  /** Force this token instead of cookie-based one */
  authToken?: string | null;
  /** Disable auto Authorization header from cookie */
  noAuth?: boolean;
  /** Extra headers appended after defaults (can override) */
  extraHeaders?: Record<string, string>;
  /** Treat `path` as absolute URL and don't prepend base URL */
  absolute?: boolean;
};

function isServer() {
  return typeof window === "undefined";
}

function resolveUrl(path: string, absolute?: boolean) {
  if (absolute) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!env.API_BASE_URL) return path; // will fail at runtime if upstream requires absolute URL
  return `${env.API_BASE_URL}${path}`;
}

/**
 * Read JWT from cookie "mp_token" (Next.js 15: cookies() is async)
 */
async function readAuthTokenFromCookie(): Promise<string | null> {
  if (!isServer()) return null;
  try {
    const cookieStore = await nextCookies();
    const token = cookieStore.get("mp_token")?.value;
    return token ?? null;
  } catch {
    return null;
  }
}

/**
 * Forward selected incoming request headers to upstream (e.g., correlation IDs, locale).
 * Next.js 15: headers() is async.
 */
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
    // ignore on client
  }
  return h;
}

/**
 * Main JSON fetcher
 */
export async function fetchJSON<T = unknown>(
  path: string,
  init: JsonInit = {},
  opts: FetchOpts = {}
): Promise<T> {
  const url = resolveUrl(path, opts.absolute);

  // Base defaults
  const baseHeaders = new Headers();
  baseHeaders.set("accept", "application/json");

  // Only set content-type JSON if body is a plain object (NOT FormData/Blob/ArrayBuffer)
  const isJsonBody =
    init.body &&
    typeof init.body === "object" &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer);

  if (isJsonBody) baseHeaders.set("content-type", "application/json");

  // Merge incoming headers (caller) with base defaults
  const mergedHeaders = new Headers(init.headers ?? {});
  for (const [k, v] of baseHeaders.entries()) {
    if (!mergedHeaders.has(k)) mergedHeaders.set(k, v);
  }

  // Authorization (server-only, unless explicitly overridden)
  if (!opts.noAuth) {
    const cookieToken = await readAuthTokenFromCookie();
    const token = opts.authToken ?? cookieToken;
    if (token && !mergedHeaders.has("authorization")) {
      mergedHeaders.set("authorization", `Bearer ${token}`);
    }
  }

  // Extra headers (override last)
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) {
      mergedHeaders.set(k, v);
    }
  }

  // Prepare body
  const body = isJsonBody ? JSON.stringify(init.body) : (init.body as any);

  const res = await fetch(url, {
    ...init,
    headers: mergedHeaders,
    body,
    credentials: "include",
    cache: "no-store", // App Router dynamic data
    // signal: init.signal, // if you need aborting support
  });

  const contentType = res.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  if (!res.ok) {
    // Try to extract an informative error message
    let message = res.statusText || `Request failed (${res.status})`;
    if (isJsonResponse) {
      try {
        const j = await res.json();
        if (j?.error?.message) message = j.error.message;
        else if (j?.message) message = j.message;
      } catch {
        /* ignore */
      }
    } else {
      try {
        const txt = await res.text();
        if (txt) message = txt;
      } catch {
        /* ignore */
      }
    }
    throw new Error(`Upstream ${res.status}: ${message}`);
  }

  if (!isJsonResponse) {
    // Allow text/other payloads
    return (await res.text()) as unknown as T;
  }
  return (await res.json()) as T;
}
