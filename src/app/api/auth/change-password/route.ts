// src/app/api/auth/change-password/route.ts
import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { fetchJSON } from "@/lib/http";
import { handleRouteError, handleZodError } from "@/lib/errors";

const BodySchema = z.object({
  old_password: z.string().min(1, "กรุณากรอกรหัสผ่านเดิม"),
  new_password: z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export async function PATCH(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) throw new Error("Not authenticated");

    const data = await fetchJSON<{ message: string }>(
      `${env.API_BASE_URL}/users/me/password`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }
    );

    return Response.json({ ok: true, data });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
