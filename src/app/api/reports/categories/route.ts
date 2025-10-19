import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/reports/categories?year=2024&month=6&type=expense
 *  - รวมยอดตามหมวดแบบเดียวกับ dashboard/categories
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const type = (url.searchParams.get("type") ?? "expense") as
      | "income"
      | "expense";

    if (!Number.isFinite(year) || year < 1970) {
      return jsonError(422, "year is required");
    }
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return jsonError(422, "month is required (1–12)");
    }

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

    const rows = (Array.isArray(tr.data) ? tr.data : []).filter((r: any) => {
      const d = new Date(r.date);
      return (
        r.type === type &&
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      );
    });

    const agg = new Map<string, number>();
    for (const r of rows) {
      const key = String(r.tag ?? r.category ?? r.tag_id ?? "อื่น ๆ");
      const val = Number(r.value ?? r.amount ?? 0) || 0;
      agg.set(key, (agg.get(key) ?? 0) + val);
    }

    const series = Array.from(agg.entries()).map(([category, expense]) => ({
      category,
      expense,
    }));
    series.sort((a, b) => b.expense - a.expense);

    return Response.json({ ok: true, data: series });
  } catch (e) {
    return handleRouteError(e);
  }
}
