import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/reports/summary?mode=MONTH|RANGE&year=2024&month=6&type=all
 *  - โหมด MONTH: ใช้ month_results/year แล้วเลือกเดือน
 *  - โหมด RANGE: รวมจาก transactions ช่วงเดือนที่ระบุ (สูงสุด 12 เดือน)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = (url.searchParams.get("mode") ?? "MONTH") as "MONTH" | "RANGE";
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const type = (url.searchParams.get("type") ?? "all") as
      | "all"
      | "income"
      | "expense";

    if (!Number.isFinite(year) || year < 1970) {
      return jsonError(422, "year is required");
    }

    if (mode === "MONTH") {
      if (!Number.isFinite(month) || month < 1 || month > 12) {
        return jsonError(422, "month is required (1–12)");
      }
      const yrRes = await fetch(
        new URL(`/api/month-results/year/${year}`, url),
        {
          cache: "no-store",
        }
      );
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

      // นับจำนวน txn จาก /api/transactions/me (เฉพาะเดือน/ปีนี้)
      const trRes = await fetch(new URL("/api/transactions/me", url), {
        cache: "no-store",
      });
      const tr = await trRes.json().catch(() => null);
      const txAll = Array.isArray(tr?.data) ? tr.data : [];
      const txRows = txAll.filter((r: any) => {
        const d = new Date(r.date);
        const inYM = d.getFullYear() === year && d.getMonth() + 1 === month;
        const typeOk = type === "all" ? true : r.type === type;
        return inYM && typeOk;
      });

      return Response.json({
        ok: true,
        data: {
          summary: {
            income,
            expense,
            balance,
            transactions: txRows.length,
          },
        },
      });
    }

    // RANGE mode (อย่างย่อ): คืน summary รวม ปีเดียวกันทั้งปี (สามารถขยายเพิ่มได้)
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
    const income = rows.reduce((s, r) => s + (Number(r.income) || 0), 0);
    const expense = rows.reduce((s, r) => s + (Number(r.expense) || 0), 0);
    const balance = income - expense;

    // นับจำนวน txn ทั้งปี
    const trRes = await fetch(new URL("/api/transactions/me", url), {
      cache: "no-store",
    });
    const tr = await trRes.json().catch(() => null);
    const txAll = Array.isArray(tr?.data) ? tr.data : [];
    const txRows = txAll.filter(
      (r: any) => new Date(r.date).getFullYear() === year
    );

    return Response.json({
      ok: true,
      data: {
        summary: {
          income,
          expense,
          balance,
          transactions: txRows.length,
        },
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
