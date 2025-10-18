// src/app/api/account/email/route.ts
import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

const Body = z.object({
  newEmail: z.string().email(),
  password: z.string().min(8),
});

export async function PATCH(req: Request) {
  try {
    const { newEmail, password } = Body.parse(await req.json());
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) return jsonError(401, "Not authenticated");

    const res = await fetch(`${env.API_BASE_URL}/users/me/email`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        new_email: newEmail,
        password,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        json?.detail || json?.error?.message || "เปลี่ยนอีเมลไม่สำเร็จ";
      return jsonError(res.status, message, undefined, json);
    }
    return Response.json({ ok: true, data: json });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
