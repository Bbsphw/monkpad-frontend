// src/app/api/ocr/parse/route.ts

import { env } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/errors";

// บังคับให้รันแบบ dynamic (ไม่ถูก prerender / cache ที่ build time)
export const dynamic = "force-dynamic";

// POST /api/ocr/parse
// รับไฟล์รูปจากฟอร์ม (multipart/form-data) → proxy ไปยัง BE /ocr/parse
export async function POST(req: Request) {
  try {
    // ---------------- อ่าน multipart form ----------------
    const formData = await req.formData();
    const file = formData.get("file");

    // ตรวจสอบว่ามีไฟล์และชนิดถูกต้อง (ต้องเป็น Blob/File)
    if (!(file instanceof Blob)) {
      return jsonError(422, "file is required");
    }

    // ---------------- ยิง upstream ไปยัง BE ----------------
    // สร้าง FormData ใหม่เพื่อส่งต่อ (อย่าลืมแนบชื่อไฟล์ด้วย เพื่อให้ฝั่ง BE ใช้งาน/ตรวจสอบ mime ได้ถูก)
    const upstream = await fetch(`${env.API_BASE_URL}/ocr/parse`, {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        // พยายามดึงชื่อไฟล์จาก file.name ถ้ามี ไม่งั้นตั้งชื่อ default
        fd.set("file", file, file?.name || "slip.jpg");
        return fd;
      })(),
      cache: "no-store", // ไม่ cache เพื่อให้ได้ผลล่าสุดทุกครั้ง
    });

    // พยายาม parse JSON จาก upstream (ถ้าไม่ใช่ JSON จะได้ null)
    const json = await upstream.json().catch(() => null);

    // ถ้า upstream ล้มเหลว → แปลงเป็น error response ของเรา
    if (!upstream.ok) {
      const msg = json?.detail || "OCR parse failed";
      return jsonError(upstream.status, msg);
    }

    // สำเร็จ → ห่อผลลัพธ์เป็นรูปแบบ unified { ok: true, data }
    return Response.json({ ok: true, data: json });
  } catch (e) {
    // จัดการ error ไม่คาดคิดทั้งหมดให้เป็น JSON มาตรฐาน
    return handleRouteError(e);
  }
}
