// // src/app/api/transactions/delete/[transactionId]/route.ts

// import { cookies } from "next/headers";
// import { env } from "@/lib/env";
// import { handleRouteError, jsonError } from "@/lib/errors";

// export const dynamic = "force-dynamic";

// /** DELETE /api/transactions/delete/[transactionId]
//  *  → DELETE {API}/transactions/delete/{transaction_id}
//  */
// export async function DELETE(
//   req: Request,
//   ctx: { params: Promise<{ transactionId: string }> }
// ) {
//   try {
//     const { transactionId } = await ctx.params;
//     const tid = Number(transactionId);
//     if (!Number.isFinite(tid) || tid <= 0) {
//       return jsonError(422, "Invalid transaction id");
//     }

//     // ตรวจสอบสิทธิ์ + ดึง token
//     const meUrl = new URL("/api/auth/profile", req.url);
//     const meRes = await fetch(meUrl, { cache: "no-store" });
//     const me = await meRes.json().catch(() => null);
//     if (!meRes.ok || !me?.ok) {
//       return jsonError(401, "Not authenticated");
//     }

//     const cookieStore = await cookies();
//     const token = cookieStore.get("mp_token")?.value || "";
//     console.log("test" + token);
//     if (!token) return jsonError(401, "Not authenticated");

//     // ยิงต่อ backend พร้อมแนบ Bearer token
//     const upstream = await fetch(
//       `${env.API_BASE_URL}/transactions/delete/${tid}`,
//       {
//         method: "DELETE",
//         cache: "no-store",
//         headers: {
//           Accept: "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const js = await upstream.json().catch(() => null);
//     if (!upstream.ok) {
//       const msg = js?.detail || "Delete transaction failed";
//       return jsonError(upstream.status, msg);
//     }

//     return Response.json({ ok: true, data: js });
//   } catch (e) {
//     return handleRouteError(e);
//   }
// }

// src/app/api/transactions/delete/[transactionId]/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** DELETE /api/transactions/delete/[transactionId]
 *  → DELETE {API}/transactions/delete/{transaction_id}
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await ctx.params;
    const tid = Number(transactionId);
    if (!Number.isFinite(tid) || tid <= 0) {
      return jsonError(422, "Invalid transaction id");
    }

    // ✅ อ่าน token ตรง ๆ จากคุกกี้ (pattern เดียวกับ route อื่นที่เวิร์ก)
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    // ✅ ยิงไป backend พร้อม Bearer token
    const upstream = await fetch(
      `${env.API_BASE_URL}/transactions/delete/${tid}`,
      {
        method: "DELETE",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg = js?.detail || "Delete transaction failed";
      return jsonError(upstream.status, msg);
    }

    return Response.json({ ok: true, data: js });
  } catch (e) {
    return handleRouteError(e);
  }
}
