// src/app/api/auth/profile/route.ts
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("mp_token")?.value || "";

    // ถ้าเผลอ encode มา ให้ลองถอดก่อน (ไม่ throw ถ้าถอดไม่ได้)
    try {
      token = decodeURIComponent(token);
    } catch {
      // ignore
    }

    if (!token) return jsonError(401, "Not authenticated");

    const res = await fetch(`${env.API_BASE_URL}/users/me`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (!res.ok) {
      if ([401, 403, 422].includes(res.status)) {
        return jsonError(401, "Not authenticated");
      }
      const ct = res.headers.get("content-type") || "";
      let detail: unknown = undefined;
      try {
        detail = ct.includes("application/json")
          ? await res.json()
          : await res.text();
      } catch {}
      return jsonError(
        502,
        `Upstream error (${res.status})`,
        undefined,
        detail
      );
    }

    const data = (await res.json()) as {
      id: number;
      username: string;
      email: string;
    };
    return Response.json({ ok: true, data });
  } catch (e) {
    return handleRouteError(e);
  }
}
