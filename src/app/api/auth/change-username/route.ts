// src/app/api/auth/change-username/route.ts
import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { fetchJSON } from "@/lib/http";
import { handleRouteError, handleZodError } from "@/lib/errors";

const BodySchema = z.object({
  new_username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function PATCH(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) throw new Error("Not authenticated");

    const data = await fetchJSON<{ message: string; username: string }>(
      `${env.API_BASE_URL}/users/me/username`,
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
