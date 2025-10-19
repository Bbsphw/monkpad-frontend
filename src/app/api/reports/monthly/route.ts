import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/reports/monthly?year=2024
 *  - คืน series รายเดือน: [{month, income, expense}]
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    if (!Number.isFinite(year) || year < 1970) {
      return jsonError(422, "year is required");
    }

    const yrRes = await fetch(new URL(`/api/month-results/year/${year}`, url), {
      cache: "no-store",
    });
    const yr = await yrRes.json().catch(() => null);
    if (!yrRes.ok || !yr?.ok) {
      return jsonError(
        yrRes.status,
        yr?.error?.message ?? "month-results failed"
      );
    }

    const rows: any[] = Array.isArray(yr.data) ? yr.data : [];
    const series = rows
      .map((r) => ({
        month: `${String(r.month).padStart(2, "0")}/${String(year).slice(-2)}`,
        income: Number(r.income ?? 0) || 0,
        expense: Number(r.expense ?? 0) || 0,
      }))
      .sort(
        (a, b) => Number(a.month.slice(0, 2)) - Number(b.month.slice(0, 2))
      );

    return Response.json({ ok: true, data: series });
  } catch (e) {
    return handleRouteError(e);
  }
}
