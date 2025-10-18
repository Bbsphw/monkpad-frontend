import { z } from "zod";
import { env } from "@/lib/env";
import { handleRouteError, handleZodError, jsonError } from "@/lib/errors";

const Body = z
  .object({
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    code: z.string().min(6, "กรอกรหัส 6 หลัก").max(6, "กรอกรหัส 6 หลัก"),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร")
      .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็ก (a-z)")
      .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่ (A-Z)")
      .regex(/\d/, "ต้องมีตัวเลข (0-9)"),
    confirmNewPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "รหัสผ่านใหม่ไม่ตรงกัน",
  });

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = Body.parse(await req.json());

    const res = await fetch(`${env.API_BASE_URL}/password/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, code, new_password: newPassword }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        json?.detail ||
        json?.error?.message ||
        "ยืนยันรหัสไม่สำเร็จ โปรดลองอีกครั้ง";
      return jsonError(res.status, msg, undefined, json);
    }

    return Response.json({ ok: true, data: json });
  } catch (e) {
    if (e instanceof z.ZodError) return handleZodError(e);
    return handleRouteError(e);
  }
}
