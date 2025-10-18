// src/app/api/auth/logout/route.ts
export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    [
      "mp_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      "mp_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ].join(", ")
  );
  return res;
}

export const GET = POST;
