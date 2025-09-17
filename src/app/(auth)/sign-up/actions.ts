"use server";

import { signUpSchema, type SignUpFormData } from "@/lib/validators";

export type RegisterResult =
  | { success: true; message?: string }
  | {
      success: false;
      formError?: string;
      fieldErrors?: Record<string, string[] | undefined>;
      status?: number;
    };

export async function registerUserAction(
  input: SignUpFormData
): Promise<RegisterResult> {
  // Validate ฝั่ง server
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      success: false,
      fieldErrors: flat.fieldErrors,
      formError: flat.formErrors?.[0],
      status: 400,
    };
  }

  const { username, email, password } = parsed.data;

  // ยิงจาก Server → ไม่โดน CORS ของเบราว์เซอร์
  const base = process.env.BACKEND_URL;
  if (!base) {
    return {
      success: false,
      formError: "Server config ผิดพลาด: BACKEND_URL ไม่ถูกตั้งค่า",
      status: 500,
    };
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/users/add/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // cache: "no-store" // โดยปกติ POST ไม่ cache อยู่แล้ว
    body: JSON.stringify({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    // พยายามดึงข้อความ error จาก backend
    const msg =
      (typeof body === "object" && (body?.message || body?.detail)) ||
      (typeof body === "string" ? body : "") ||
      res.statusText;

    // map ฟิลด์คร่าว ๆ (ปรับตาม response ของ backend จริงได้)
    const fieldErrors: Record<string, string[] | undefined> = {};
    const lower = String(msg).toLowerCase();

    if (lower.includes("username"))
      fieldErrors.username = ["ชื่อผู้ใช้ถูกใช้แล้วหรือไม่ถูกต้อง"];
    if (lower.includes("email"))
      fieldErrors.email = ["อีเมลถูกใช้แล้วหรือไม่ถูกต้อง"];
    if (lower.includes("password"))
      fieldErrors.password = ["รูปแบบรหัสผ่านไม่ถูกต้อง"];

    const hasField = Object.keys(fieldErrors).length > 0;

    return {
      success: false,
      status: res.status,
      formError: hasField ? undefined : msg || "สมัครสมาชิกไม่สำเร็จ",
      fieldErrors: hasField ? fieldErrors : undefined,
    };
  }

  return { success: true, message: "สมัครสมาชิกสำเร็จ" };
}
