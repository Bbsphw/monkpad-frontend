// // src/lib/api-auth.ts
// type LoginInput = { identifier: string; password: string };

// export async function apiLogin({ identifier, password }: LoginInput) {
//   const base = process.env.NEXT_PUBLIC_API_URL;
//   if (!base) throw new Error("NEXT_PUBLIC_API_URL not set");

//   // แปลง identifier ให้ backend รู้ว่าเป็น username หรือ email
//   const payload = identifier.includes("@")
//     ? { email: identifier.trim().toLowerCase(), password }
//     : { username: identifier.trim(), password };

//   const res = await fetch(`${base}/users/login/`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//     cache: "no-store",
//   });

//   if (!res.ok) throw new Error(await res.text());

//   const user = await res.json();
//   return {
//     id: user.id ?? "1",
//     name: user.username ?? user.email ?? identifier,
//     email: user.email,
//     role: user.role ?? "user",
//   };
// }

// src/lib/api-auth.ts
export type SignUpInput = { username: string; email: string; password: string };

// โยน error แบบมีโครงสร้าง เพื่อง่ายต่อการ map ไปยังฟอร์ม
export class ApiFieldError extends Error {
  field?: "username" | "email" | "password" | "confirmPassword" | "form";
  constructor(message: string, field?: ApiFieldError["field"]) {
    super(message);
    this.field = field;
  }
}

export async function apiSignUp(input: SignUpInput) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL not set");

  const res = await fetch(`${base.replace(/\/$/, "")}/users/add/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });

  // แปลง error ให้เป็น field-friendly
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const msg =
      (typeof body === "object" && (body?.message || body?.detail)) ||
      (typeof body === "string" ? body : "") ||
      res.statusText;

    // ตัวอย่าง mapping แบบพื้นฐาน (แก้ตามรูปแบบ response ของ backend จริงได้)
    if (String(msg).toLowerCase().includes("username")) {
      throw new ApiFieldError(
        "ชื่อผู้ใช้งานถูกใช้แล้วหรือไม่ถูกต้อง",
        "username"
      );
    }
    if (String(msg).toLowerCase().includes("email")) {
      throw new ApiFieldError("อีเมลถูกใช้แล้วหรือไม่ถูกต้อง", "email");
    }
    if (String(msg).toLowerCase().includes("password")) {
      throw new ApiFieldError("รูปแบบรหัสผ่านไม่ถูกต้อง", "password");
    }
    throw new ApiFieldError(msg || "สมัครสมาชิกไม่สำเร็จ", "form");
  }

  return body; // ตามต้องการ (id/user/token/ฯลฯ)
}
