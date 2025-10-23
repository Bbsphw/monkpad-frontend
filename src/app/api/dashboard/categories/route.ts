// Get route เดียวแล้วจัดการข้อมูลแยกแต่ละส่วนๆ
// src/app/api/dashboard/categories/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/**
 * GET /api/dashboard/categories?year=2025&month=6&type=expense
 * - Validate query (year, month, type)
 * - Auth ด้วย JWT ใน cookie (mp_token) และดึง uid จาก JWT payload
 * - ดึงธุรกรรมทั้งหมดของ user จาก upstream (ไม่กรองที่ upstream)
 * - กรองเองตาม (เดือน/ปี + type) แล้ว aggregate เป็นยอดรายหมวด
 * - ส่งกลับทั้งแบบ object ใหม่ และ legacy array เพื่อความเข้ากันได้ย้อนหลัง
 */
export async function GET(req: Request) {
  try {
    // --- 1) parse & validate query ---
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const type = (url.searchParams.get("type") ?? "expense") as
      | "income"
      | "expense";

    if (!Number.isFinite(year)) return jsonError(422, "year is required");
    if (!Number.isFinite(month) || month < 1 || month > 12)
      return jsonError(422, "month is required (1-12)");

    // --- 2) auth ---
    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    // --- 3) fetch upstream: ดึงทุกธุรกรรม user (ให้ FE ไป derive ส่วนอื่นต่อได้) ---
    const upstream = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const js = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      // ผูก error ขึ้นตามสถานะ upstream
      return jsonError(upstream.status, js?.detail || "transactions failed");
    }
    // normalize: fallback เป็น array ว่างถ้า payload ไม่ตรง
    const allTx = Array.isArray(js?.transactions) ? js.transactions : [];

    // --- 4) filter เฉพาะเดือน/ปี/ประเภทที่ถามมา แล้ว aggregate ยอดตามหมวด ---
    interface Transaction {
      date?: string | number | Date | null;
      type?: "income" | "expense" | string;
      tag?: string | number | null;
      category?: string | number | null;
      tag_id?: string | number | null;
      value?: number | string | null;
      amount?: number | string | null;
      [key: string]: unknown;
    }

    const typedAllTx = allTx as Transaction[];

    const filtered = typedAllTx.filter((r: Transaction) => {
      const d = new Date(r.date as string);
      return (
        r.type === type &&
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      );
    });

    const agg = new Map<string, number>();
    for (const r of filtered) {
      // รองรับหลายรูปแบบ field จาก backend/tag: tag | category | tag_id
      const key = String(r.tag ?? r.category ?? r.tag_id ?? "อื่น ๆ");
      const val = Number(r.value ?? r.amount ?? 0) || 0;
      agg.set(key, (agg.get(key) ?? 0) + val);
    }

    const categories = [...(agg as Map<string, number>).entries()]
      .map(([category, expense]) => ({ category, expense }))
      .sort((a, b) => b.expense - a.expense);

    // --- 5) ส่งกลับ: object ใหม่ + legacy สำหรับ client เก่า ---
    return Response.json({
      ok: true,
      data: {
        transactions: allTx, // FE ใหม่จะ derive summary/traffic/recent ต่อเอง
        categories, // FE ใหม่ใช้ตรง ๆ ได้
        legacy: categories, // FE เก่าที่คาดหวัง array เดิม
      },
    });
  } catch (e) {
    // รวม error handling (แปลงเป็น JSON มาตรฐาน)
    return handleRouteError(e);
  }
}
