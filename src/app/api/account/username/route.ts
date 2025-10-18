// src/app/api/account/username/route.ts
import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

const Body = z.object({
  newUsername: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[A-Za-z0-9_.-]+$/),
  password: z.string().min(8),
});

export async function PATCH(req: Request) {
  try {
    const { newUsername, password } = Body.parse(await req.json());
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) return jsonError(401, "Not authenticated");

    const res = await fetch(`${env.API_BASE_URL}/users/me/username`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        new_username: newUsername,
        password,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        json?.detail || json?.error?.message || "เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ";
      return jsonError(res.status, message, undefined, json);
    }
    return Response.json({ ok: true, data: json });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
