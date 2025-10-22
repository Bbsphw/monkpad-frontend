// // src/app/api/tags/me/route.ts
// import { env } from "@/lib/env";
// import { handleRouteError, jsonError } from "@/lib/errors";

// export const dynamic = "force-dynamic";

// export async function GET() {
//   try {
//     // 1) ขอโปรไฟล์เพื่อรู้ user_id
//     const meRes = await fetch(`${env.APP_ORIGIN || ""}/api/auth/profile`, {
//       method: "GET",
//       cache: "no-store",
//     });
//     const me = await meRes.json().catch(() => null);
//     if (!meRes.ok || !me?.ok || !me?.data?.id) {
//       return jsonError(401, "Not authenticated");
//     }

//     // 2) ดึงแท็กของ user ตาม backend `/tags/{user_id}`
//     const resp = await fetch(`${env.API_BASE_URL}/tags/${me.data.id}`, {
//       method: "GET",
//       cache: "no-store",
//       headers: { accept: "application/json" },
//     });

//     const js = await resp.json().catch(() => null);
//     if (!resp.ok) {
//       const msg = js?.detail || "Failed to fetch tags";
//       return jsonError(resp.status, msg);
//     }

//     // backend คืนเป็น array (หรือ 404 ถ้าไม่มี) → normalize เป็น array เสมอ
//     return Response.json({ ok: true, data: Array.isArray(js) ? js : [] });
//   } catch (e) {
//     return handleRouteError(e);
//   }
// }

// src/app/api/tags/me/route.ts

import { cookies } from "next/headers";
import { decodeJwt } from "@/lib/jwt";
import { fetchJSON } from "@/lib/http";
import { handleRouteError, jsonError } from "@/lib/errors";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value;
    if (!token) return jsonError(401, "Not authenticated");

    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    // ดึง tag ทั้งหมดของ user (ฝั่ง backend auth-guard อยู่แล้ว)
    const tags = await fetchJSON<any[]>(`/tags/${uid}`);

    return Response.json({ ok: true, data: tags });
  } catch (e) {
    return handleRouteError(e);
  }
}
