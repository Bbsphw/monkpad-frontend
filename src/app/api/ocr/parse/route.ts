import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return jsonError(422, "file is required");
    }

    const upstream = await fetch(`${env.API_BASE_URL}/ocr/parse`, {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        fd.set("file", file, (file as any)?.name || "slip.jpg");
        return fd;
      })(),
      cache: "no-store",
    });

    const json = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg = json?.detail || "OCR parse failed";
      return jsonError(upstream.status, msg);
    }
    return Response.json({ ok: true, data: json });
  } catch (e) {
    return handleRouteError(e);
  }
}
