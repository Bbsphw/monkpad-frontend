// src/app/api/reports/categories/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/* ───────────────────────────── Types ─────────────────────────────
 * อธิบายโครงของธุรกรรมที่ BE ส่งมาให้เรา
 * - อนุโลม field บางตัวเป็น union / nullable เพราะแหล่งข้อมูลอาจหลากหลาย
 * - หลีกเลี่ยง any โดยกำหนด unknown กับ index signature และค่อย ๆ แปลงเฉพาะที่ใช้
 */
type TxType = "income" | "expense";
type UpstreamTransaction = {
  id?: number | string;
  date: string; // ISO-like string
  type: TxType | string; // upstream อาจส่ง string แปลก ๆ มา → เราจะกรองเอง
  tag?: string | null;
  category?: string | null;
  tag_id?: number | string | null;
  value?: number | null;
  amount?: number | null;
  [k: string]: unknown; // กันช่องอื่น ๆ ที่เราไม่ใช้ (ไม่ใช่ any)
};

/** โครงของ category series ที่จะส่งกลับไปให้ FE */
type CategoryDatum = { category: string; expense: number };

/**
 * GET /api/reports/categories?year=2025&month=10&type=expense
 * - ดึงธุรกรรมทั้งหมดของผู้ใช้ แล้วสรุปยอดรายหมวด (category/tag) เฉพาะเดือน/ปี/ประเภทที่ขอ
 * - คืน transactions ทั้งหมด (เพื่อให้ FE นำไป derive รายงานอื่น ๆ ได้เอง) + series หมวดที่รวมแล้ว
 */
export async function GET(req: Request) {
  try {
    // ----- อ่านและ validate query -----
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const typeParam = (url.searchParams.get("type") ?? "expense") as
      | TxType
      | string;

    if (!Number.isFinite(year)) return jsonError(422, "year is required");
    if (!Number.isFinite(month) || month < 1 || month > 12)
      return jsonError(422, "month is required (1–12)");

    // รับเฉพาะ "income" | "expense" เท่านั้น (กันค่าประหลาดจาก query)
    const type: TxType =
      typeParam === "income" || typeParam === "expense" ? typeParam : "expense";

    // ----- auth: อ่าน token จากคุกกี้ + ดึง uid จาก JWT -----
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // ----- เรียก backend: ดึงธุรกรรมทั้งหมดของ user -----
    const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    const js: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      // พยายามอ่าน message จาก payload ถ้ามี
      const detail =
        typeof js === "object" && js !== null && "detail" in js
          ? String((js as { detail?: unknown }).detail ?? "")
          : "";
      return jsonError(upstream.status, detail || "transactions failed");
    }

    // ดึง rows จาก payload อย่างปลอดภัยและกำหนดชนิดให้ชัดเจน
    const rows: UpstreamTransaction[] =
      typeof js === "object" &&
      js !== null &&
      "transactions" in js &&
      Array.isArray((js as { transactions?: unknown }).transactions)
        ? ((js as { transactions: unknown[] })
            .transactions as unknown as UpstreamTransaction[])
        : [];

    // ----- กรองให้ตรงปี/เดือน/ประเภท -----
    const filtered: UpstreamTransaction[] = rows.filter((r) => {
      const d = new Date(String(r.date));
      if (Number.isNaN(d.getTime())) return false; // กันข้อมูลวันที่ไม่ถูกต้อง
      // เฉพาะ type ที่เรารองรับจริง ๆ
      if (r.type !== type) return false;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    // ----- รวมยอดตามหมวด (รองรับ tag, category, tag_id) -----
    // ใช้ Map เพื่อให้ O(n) แล้วค่อยแปลงเป็น array
    const agg = new Map<string, number>();
    for (const r of filtered) {
      const key = String(r.tag ?? r.category ?? r.tag_id ?? "อื่น ๆ");
      const raw = r.value ?? r.amount ?? 0;
      const val = Number(raw);
      const v = Number.isFinite(val) ? val : 0;
      agg.set(key, (agg.get(key) ?? 0) + v);
    }

    // สร้าง series: [{ category, expense }] เรียงจากมาก→น้อย
    const series: CategoryDatum[] = [...agg.entries()]
      .map(([category, expense]) => ({ category, expense }))
      .sort((a, b) => b.expense - a.expense);

    // ----- ส่งกลับ: ทั้ง transactions (สำหรับ derive ฝั่ง FE) + series ที่รวมให้แล้ว -----
    return Response.json({
      ok: true,
      data: {
        transactions: rows, // เก็บชนิด UpstreamTransaction ไว้ ให้ FE ตีความต่อได้
        categories: series,
      },
    });
  } catch (e) {
    // ให้รูปแบบ error JSON ที่สม่ำเสมอ
    return handleRouteError(e);
  }
}
