import { z } from "zod";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

const Body = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
});

export async function POST(req: Request) {
  try {
    const { email } = Body.parse(await req.json());

    const res = await fetch(`${env.API_BASE_URL}/password/forgot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    // backend ตอบ 200 เสมอ (เพื่อความปลอดภัย) แต่ว่าอาจตอบ 429 ถ้าเกิน rate
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.detail || "ไม่สามารถส่งรหัสได้ โปรดลองอีกครั้ง";
      return jsonError(res.status, msg, undefined, json);
    }
    return Response.json({ ok: true, data: json });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
