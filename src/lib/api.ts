// src/lib/api.ts
type LoginInput = { identifier: string; password: string };

type LoginResponse = {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  // ถ้ามี token จาก backend ก็เพิ่มฟิลด์รับตรงนี้ได้ เช่น accessToken?: string
};

function buildLoginPayload({ identifier, password }: LoginInput) {
  // ถ้าเป็นอีเมล → ส่ง email, ถ้าไม่ใช่ → ส่ง username
  if (identifier.includes("@")) {
    return { email: identifier.trim().toLowerCase(), password };
  }
  return { username: identifier.trim(), password };
}

export async function apiLogin(input: LoginInput): Promise<LoginResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const path = process.env.MONKPAD_LOGIN_PATH || "/users/login/";
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");

  const payload = buildLoginPayload(input);
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // NOTE: ถ้า endpoint บางตัวต้อง header เพิ่ม (เช่น role: "admin") ใส่ตรงนี้ได้
    body: JSON.stringify(payload),
    // login ไม่ควร cache
    cache: "no-store",
  });

  // แปลง error ให้เข้าใจง่าย
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const details =
      (isJson ? body?.message || body?.error : String(body)) || res.statusText;
    throw new Error(`${res.status} ${details}`);
  }

  return (body ?? {}) as LoginResponse;
}
