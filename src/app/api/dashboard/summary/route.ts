// src/app/api/dashboard/summary/route.ts
import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/dashboard/summary?year=2024&month=6
 *   - ดึง month_results ปีนั้น แล้วเลือกเดือนที่ต้องการ
 *   - คำนวณ balance = income - expense
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));

    if (!Number.isFinite(year) || year < 1970) {
      return jsonError(422, "year is required");
    }
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return jsonError(422, "month is required (1–12)");
    }

    // ใช้ internal API: /api/month-results/year/[year]
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

    const row =
      (yr.data as any[]).find((r) => Number(r.month) === month) ?? null;

    const income = Number(row?.income ?? 0) || 0;
    const expense = Number(row?.expense ?? 0) || 0;
    const balance = income - expense;

    return Response.json({
      ok: true,
      data: { year, month, income, expense, balance },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
