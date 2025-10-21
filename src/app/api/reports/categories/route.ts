// // src/app/api/reports/categories/route.ts

// import { cookies } from "next/headers";
// import { env } from "@/lib/env";
// import { decodeJwt } from "@/lib/jwt";
// import { handleRouteError, jsonError } from "@/lib/errors";

// /** GET /api/reports/categories?year=2025&month=6&type=expense */
// export async function GET(req: Request) {
//   try {
//     const url = new URL(req.url);
//     const year = Number(url.searchParams.get("year"));
//     const month = Number(url.searchParams.get("month"));
//     const type = (url.searchParams.get("type") ?? "expense") as
//       | "income"
//       | "expense";
//     if (!Number.isFinite(year)) return jsonError(422, "year is required");
//     if (!Number.isFinite(month) || month < 1 || month > 12)
//       return jsonError(422, "month is required (1-12)");

//     const cookieStore = await cookies();
//     const token = cookieStore.get("mp_token")?.value || "";
//     if (!token) return jsonError(401, "Not authenticated");
//     const { uid } = decodeJwt<{ uid?: number }>(token) || {};
//     if (!uid) return jsonError(401, "Not authenticated");

//     const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
//       headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
//       cache: "no-store",
//     });
//     const js = await upstream.json().catch(() => null);
//     if (!upstream.ok)
//       return jsonError(upstream.status, js?.detail || "transactions failed");

//     const rows = Array.isArray(js?.transactions) ? js.transactions : [];
//     const filtered = rows.filter((r: any) => {
//       const d = new Date(r.date);
//       return (
//         r.type === type &&
//         d.getFullYear() === year &&
//         d.getMonth() + 1 === month
//       );
//     });

//     const agg = new Map<string, number>();
//     for (const r of filtered) {
//       const key = String(r.tag ?? r.category ?? r.tag_id ?? "อื่น ๆ");
//       const val = Number(r.value ?? r.amount ?? 0) || 0;
//       agg.set(key, (agg.get(key) ?? 0) + val);
//     }
//     const series = [...agg.entries()]
//       .map(([category, expense]) => ({ category, expense }))
//       .sort((a, b) => b.expense - a.expense);

//     return Response.json({ ok: true, data: series });
//   } catch (e) {
//     return handleRouteError(e);
//   }
// }

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/reports/categories?year=2025&month=10&type=expense */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const type = (url.searchParams.get("type") ?? "expense") as
      | "income"
      | "expense";

    if (!Number.isFinite(year)) return jsonError(422, "year is required");
    if (!Number.isFinite(month) || month < 1 || month > 12)
      return jsonError(422, "month is required (1–12)");

    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok)
      return jsonError(upstream.status, js?.detail || "transactions failed");

    const rows = Array.isArray(js?.transactions) ? js.transactions : [];

    // ✅ กรองปี/เดือน/ประเภท
    const filtered = rows.filter((r: any) => {
      const d = new Date(r.date);
      return (
        r.type === type &&
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      );
    });

    // ✅ รวมหมวด (tag)
    const agg = new Map<string, number>();
    for (const r of filtered) {
      const key = String(r.tag ?? r.category ?? r.tag_id ?? "อื่น ๆ");
      const val = Number(r.value ?? r.amount ?? 0) || 0;
      agg.set(key, (agg.get(key) ?? 0) + val);
    }
    const series = [...agg.entries()]
      .map(([category, expense]) => ({ category, expense }))
      .sort((a, b) => b.expense - a.expense);

    // ✅ คืนแบบรวมครบ (เพื่อ client ใช้ derive summary/monthly เอง)
    return Response.json({
      ok: true,
      data: {
        transactions: rows,
        categories: series,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
