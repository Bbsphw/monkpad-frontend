// src/app/api/transactions/update/[transactionId]/route.ts

// import { env } from "@/lib/env";
// import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
// import { z } from "zod";

// export const dynamic = "force-dynamic";

// /** body ตาม backend: ทุกฟิลด์ optional (ถ้ามีจะอัปเดต) */
// const BodySchema = z.object({
//   tag_id: z.number().int().positive().optional(),
//   value: z.number().positive().optional(),
//   time: z
//     .string()
//     .regex(/^\d{2}:\d{2}$/)
//     .optional(), // HH:MM
//   date: z
//     .string()
//     .regex(/^\d{4}-\d{2}-\d{2}$/)
//     .optional(), // YYYY-MM-DD
//   note: z.string().max(500).optional(),
// });

// /** PUT /api/transactions/update/[transactionId]
//  *   → PUT {API}/transactions/update/{transaction_id}
//  */
// export async function PUT(
//   req: Request,
//   ctx: { params: Promise<{ transactionId: string }> }
// ) {
//   try {
//     const { transactionId } = await ctx.params;
//     const tid = Number(transactionId);
//     if (!Number.isFinite(tid) || tid <= 0) {
//       return jsonError(422, "Invalid transaction id");
//     }

//     const body = BodySchema.parse(await req.json());

//     // auth guard
//     const meUrl = new URL("/api/auth/profile", req.url);
//     const meRes = await fetch(meUrl, { cache: "no-store" });
//     const me = await meRes.json().catch(() => null);
//     if (!meRes.ok || !me?.ok) {
//       return jsonError(401, "Not authenticated");
//     }

//     const upstream = await fetch(
//       `${env.API_BASE_URL}/transactions/update/${tid}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify(body),
//         cache: "no-store",
//       }
//     );

//     const js = await upstream.json().catch(() => null);
//     if (!upstream.ok) {
//       const msg = js?.detail || "Update transaction failed";
//       return jsonError(upstream.status, msg);
//     }

//     return Response.json({ ok: true, data: js });
//   } catch (e) {
//     if (e instanceof z.ZodError) return handleZodError(e);
//     return handleRouteError(e);
//   }
// }

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  tag_id: z.number().int().positive().optional(),
  value: z.number().positive().optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().max(500).optional(),
});

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await ctx.params;
    const tid = Number(transactionId);
    if (!Number.isFinite(tid) || tid <= 0)
      return jsonError(422, "Invalid transaction id");

    const body = BodySchema.parse(await req.json());

    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    const upstream = await fetch(
      `${env.API_BASE_URL}/transactions/update/${tid}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      if ([401, 403].includes(upstream.status))
        return jsonError(401, "Not authenticated");
      return jsonError(
        upstream.status,
        js?.detail || "Update transaction failed"
      );
    }
    return Response.json({ ok: true, data: js });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
