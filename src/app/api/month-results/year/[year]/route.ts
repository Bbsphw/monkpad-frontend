// src/app/api/month-results/year/[year]/route.ts

// import { env } from "@/lib/env";
// import { handleRouteError, jsonError } from "@/lib/errors";

// export const dynamic = "force-dynamic";

// /** GET /api/month-results/year/[year] → GET {API}/month_results/{user_id}/{year} */
// export async function GET(
//   req: Request,
//   ctx: { params: Promise<{ year: string }> }
// ) {
//   try {
//     const { year } = await ctx.params;
//     const y = Number(year);
//     if (!Number.isFinite(y) || y < 1970) {
//       return jsonError(422, "Invalid year");
//     }

//     const meUrl = new URL("/api/auth/profile", req.url);
//     const meRes = await fetch(meUrl, { cache: "no-store" });
//     const me = await meRes.json().catch(() => null);
//     if (!meRes.ok || !me?.ok || !me?.data?.id) {
//       return jsonError(401, "Not authenticated");
//     }
//     const userId = me.data.id as number;

//     const upstream = await fetch(
//       `${env.API_BASE_URL}/month_results/${userId}/${y}`,
//       {
//         method: "GET",
//         cache: "no-store",
//         headers: { Accept: "application/json" },
//       }
//     );

//     const js = await upstream.json().catch(() => null);
//     if (!upstream.ok) {
//       const msg = js?.detail || "Fetch month results by year failed";
//       return jsonError(upstream.status, msg);
//     }

//     return Response.json({ ok: true, data: js });
//   } catch (e) {
//     return handleRouteError(e);
//   }
// }

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** GET /api/month-results/year/[year] → GET {API}/month_results/{user_id}/{year} */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await ctx.params;
    const y = Number(year);
    if (!Number.isFinite(y) || y < 1970) return jsonError(422, "Invalid year");

    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    const upstream = await fetch(
      `${env.API_BASE_URL}/month_results/${uid}/${y}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok)
      return jsonError(
        upstream.status,
        js?.detail || "Fetch month results by year failed"
      );

    return Response.json({ ok: true, data: js });
  } catch (e) {
    return handleRouteError(e);
  }
}
