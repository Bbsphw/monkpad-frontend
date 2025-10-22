// src/app/api/transactions/add/route.ts

// import { env } from "@/lib/env";
// import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
// import { z } from "zod";

// const BodySchema = z.object({
//   tag_id: z.number().int().positive(),
//   value: z.number().positive(),
//   date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
//   time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
//   note: z.string().max(500).optional().default(""),
// });

// export async function POST(req: Request) {
//   try {
//     const body = BodySchema.parse(await req.json());

//     const meUrl = new URL("/api/auth/profile", req.url);
//     const meRes = await fetch(meUrl, { cache: "no-store" });
//     const me = await meRes.json().catch(() => null);
//     if (!meRes.ok || !me?.ok || !me?.data?.id) {
//       return jsonError(401, "Not authenticated");
//     }

//     const upstream = await fetch(`${env.API_BASE_URL}/transactions/add/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         user_id: me.data.id,
//         tag_id: body.tag_id,
//         value: body.value,
//         date: body.date,
//         time: body.time,
//         note: body.note,
//       }),
//       cache: "no-store",
//     });

//     const js = await upstream.json().catch(() => null);
//     if (!upstream.ok) {
//       const msg = js?.detail || "Create transaction failed";
//       return jsonError(upstream.status, msg);
//     }
//     return Response.json({ ok: true, data: js });
//   } catch (e) {
//     if (e instanceof z.ZodError) return handleZodError(e);
//     return handleRouteError(e);
//   }
// }

// src/app/api/transactions/add/route.ts

import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

const BodySchema = z.object({
  tag_id: z.number().int().positive(),
  value: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  note: z.string().max(500).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    const upstream = await fetch(`${env.API_BASE_URL}/transactions/add/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        user_id: uid,
        tag_id: body.tag_id,
        value: body.value,
        date: body.date,
        time: body.time,
        note: body.note,
      }),
      cache: "no-store",
    });

    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      if ([401, 403].includes(upstream.status))
        return jsonError(401, "Not authenticated");
      return jsonError(
        upstream.status,
        js?.detail || "Create transaction failed"
      );
    }
    return Response.json({ ok: true, data: js });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
