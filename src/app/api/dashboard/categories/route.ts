// // src/app/api/dashboard/categories/route.ts

// import { cookies } from "next/headers";
// import { env } from "@/lib/env";
// import { decodeJwt } from "@/lib/jwt";
// import { handleRouteError, jsonError } from "@/lib/errors";

// /** GET /api/dashboard/categories?year=2025&month=6&type=expense */
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

//     // ดึง transactions ของ user
//     const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
//       headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
//       cache: "no-store",
//     });
//     const js = await upstream.json().catch(() => null);
//     if (!upstream.ok)
//       return jsonError(upstream.status, js?.detail || "transactions failed");
//     const rows = Array.isArray(js?.transactions) ? js.transactions : [];

//     // กรองเดือน/ปี/ประเภท แล้ว aggregate ตามหมวด (tag)
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

// Get route เดียวแล้วจัดการข้อมูลแยกแต่ละส่วนๆ
// src/app/api/dashboard/categories/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/dashboard/categories?year=2025&month=6&type=expense */
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
      return jsonError(422, "month is required (1-12)");

    // auth
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // ดึงธุรกรรมทั้งหมดของ user (ไม่กรองเดือนตรงนี้ เพื่อให้ front-end เอาไป derive รายอื่นได้)
    const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return jsonError(upstream.status, js?.detail || "transactions failed");
    }
    const allTx = Array.isArray(js?.transactions) ? js.transactions : [];

    // ทำ series หมวดจาก "เดือน/ปี" + "type" ที่ขอมา
    const filtered = allTx.filter((r: any) => {
      const d = new Date(r.date);
      return (
        r.type === type &&
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      );
    });

    const agg = new Map<string, number>();
    for (const r of filtered) {
      const key = String(r.tag ?? r.category ?? r.tag_id ?? "อื่น ๆ");
      const val = Number(r.value ?? r.amount ?? 0) || 0;
      agg.set(key, (agg.get(key) ?? 0) + val);
    }
    const categories = [...agg.entries()]
      .map(([category, expense]) => ({ category, expense }))
      .sort((a, b) => b.expense - a.expense);

    // ✅ คืนทั้งสองแบบ: แบบใหม่ (object) + แบบเก่า (array) เพื่อ compat
    return Response.json({
      ok: true,
      data: {
        transactions: allTx, // ← front-end ใหม่จะใช้ derive summary/traffic/recent
        categories, // ← front-end ใหม่ใช้ก็ได้
        legacy: categories, // ← front-end เก่าที่ยังอ่านเป็น array
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
