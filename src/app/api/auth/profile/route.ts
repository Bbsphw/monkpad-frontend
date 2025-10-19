// // src/app/api/auth/profile/route.ts
// import { cookies } from "next/headers";
// import { env } from "@/lib/env";
// import { handleRouteError, jsonError } from "@/lib/errors";
// import { decodeJwt } from "@/lib/jwt";

// type Profile = { id: number; username: string; email: string };

// export async function GET() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("mp_token")?.value || "";
//   // console.log(cookieStore.getAll());

//   try {
//     // const cookieStore = await cookies();
//     // const token = cookieStore.get("mp_token")?.value || "";
//     // const cookieStore = cookies();
//     const myToken = cookieStore.get("mp_token");
//     // console.log(cookieStore.getAll());

//     let tokenDeCode;
//     try {
//       tokenDeCode = decodeURIComponent(token);
//       console.log(tokenDeCode);
//     } catch {
//       console.log("decode ไม่ผ่าน");
//     }

//     if (!tokenDeCode) {
//       console.log("token ไม่ผ่าน");
//       return jsonError(401, "Not authenticated");
//     }

//     const payload = decodeJwt<{ uid?: number; sub?: string }>(tokenDeCode);
//     const uid = payload?.uid;
//     if (!uid) {
//       console.log("uid ไม่ผ่าน");
//       return jsonError(401, "Not authenticated");
//     }
//     const res = await fetch(`${env.API_BASE_URL}/users/${uid}`, {
//       method: "GET",
//       cache: "no-store",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         Accept: "application/json",
//       },
//     });

//     if (!res.ok) {
//       if ([401, 403, 404, 422].includes(res.status)) {
//         console.log("401, 403, 404, 422");
//         return jsonError(401, "Not authenticated");
//       }
//       const ct = res.headers.get("content-type") || "";
//       let detail: unknown;
//       try {
//         detail = ct.includes("application/json")
//           ? await res.json()
//           : await res.text();
//       } catch {}
//       return jsonError(
//         502,
//         `Upstream error (${res.status})`,
//         undefined,
//         detail
//       );
//     }

//     const data = (await res.json()) as Profile;
//     return Response.json({ ok: true, data });
//   } catch (e) {
//     return handleRouteError(e);
//   }
// }

// src/app/api/auth/profile/route.ts
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";
import { decodeJwt } from "@/lib/jwt";

type Profile = { id: number; username: string; email: string };

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");

    const payload = decodeJwt<{ uid?: number }>(token);
    const uid = payload?.uid;
    if (!uid) return jsonError(401, "Not authenticated");

    const res = await fetch(`${env.API_BASE_URL}/users/${uid}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if ([401, 403, 404, 422].includes(res.status)) {
        return jsonError(401, "Not authenticated");
      }
      const ct = res.headers.get("content-type") || "";
      let detail: unknown;
      try {
        detail = ct.includes("application/json")
          ? await res.json()
          : await res.text();
      } catch {}
      return jsonError(
        502,
        `Upstream error (${res.status})`,
        undefined,
        detail
      );
    }

    const data = (await res.json()) as Profile;
    return Response.json({ ok: true, data });
  } catch (e) {
    return handleRouteError(e);
  }
}
