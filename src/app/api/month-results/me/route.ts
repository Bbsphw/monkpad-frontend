import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** GET /api/month-results/me  →  GET {API}/month_results/{user_id} */
export async function GET(req: Request) {
  try {
    // ใช้ req.url เพื่อสร้าง absolute URL ไปหาโปรไฟล์
    const meUrl = new URL("/api/auth/profile", req.url);
    const meRes = await fetch(meUrl, { cache: "no-store" });
    const me = await meRes.json().catch(() => null);
    if (!meRes.ok || !me?.ok || !me?.data?.id) {
      return jsonError(401, "Not authenticated");
    }
    const userId = me.data.id as number;

    const upstream = await fetch(
      `${env.API_BASE_URL}/month_results/${userId}`,
      {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    );

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg = js?.detail || "Fetch month results failed";
      return jsonError(upstream.status, msg);
    }
    return Response.json({ ok: true, data: js });
  } catch (e) {
    return handleRouteError(e);
  }
}
