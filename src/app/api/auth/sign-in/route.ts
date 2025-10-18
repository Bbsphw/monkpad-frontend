// src/app/api/auth/sign-in/route.ts
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { z } from "zod";

const BodySchema = z.object({
  username: z.string(),
  password: z.string(),
  remember: z.boolean().optional(),
});

function isHttps(req: Request) {
  const xfProto = req.headers.get("x-forwarded-proto");
  if (xfProto) return xfProto.split(",")[0].trim() === "https";
  return process.env.NODE_ENV === "production";
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    const upstream = await fetch(`${env.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: body.username,
        password: body.password,
      }),
    });

    const json = await upstream.json().catch(() => null);

    if (!upstream.ok || !json?.access_token) {
      const msg = json?.detail || json?.error || "Invalid credentials";
      return jsonError(upstream.status, msg);
    }

    const token = String(json.access_token);
    const remember = !!body.remember;
    const maxAge = remember ? 7 * 24 * 60 * 60 : undefined; // 7 วัน
    const exp = maxAge
      ? new Date(Date.now() + maxAge * 1000).toUTCString()
      : undefined;
    const secure = isHttps(req);

    const parts = [
      // ❌ ห้าม encode JWT ('.' อนุญาตในค่าคุกกี้)
      `mp_token=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (secure) parts.push("Secure");
    if (maxAge) {
      parts.push(`Max-Age=${maxAge}`);
      parts.push(`Expires=${exp}`);
    }

    const res = Response.json({ ok: true });
    res.headers.append("Set-Cookie", parts.join("; "));
    return res;
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
