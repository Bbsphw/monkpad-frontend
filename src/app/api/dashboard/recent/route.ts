import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/dashboard/recent?limit=10
 *  - ดึง /api/transactions/me
 *  - เรียงตาม date,time ล่าสุด และตัดจำนวนตาม limit
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "10");
    const lim = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;

    const trRes = await fetch(new URL("/api/transactions/me", url), {
      cache: "no-store",
    });
    const tr = await trRes.json().catch(() => null);
    if (!trRes.ok || !tr?.ok) {
      return jsonError(
        trRes.status,
        tr?.error?.message ?? "transactions failed"
      );
    }

    const rows = Array.isArray(tr.data) ? tr.data : [];
    rows.sort((a: any, b: any) => {
      const ad = `${a.date ?? ""} ${a.time ?? ""}`;
      const bd = `${b.date ?? ""} ${b.time ?? ""}`;
      return bd.localeCompare(ad);
    });

    return Response.json({ ok: true, data: rows.slice(0, lim) });
  } catch (e) {
    return handleRouteError(e);
  }
}
