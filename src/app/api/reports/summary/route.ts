// src/app/api/reports/summary/route.ts

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { decodeJwt } from "@/lib/jwt";
import { handleRouteError, jsonError } from "@/lib/errors";

/** GET /api/reports/summary?mode=MONTH&year=2025&month=6&type=all */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = (url.searchParams.get("mode") ?? "MONTH") as "MONTH" | "RANGE";
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const type = (url.searchParams.get("type") ?? "all") as "all" | "income" | "expense";
    if (!Number.isFinite(year)) return jsonError(422, "year is required");

    const cookieStore = await cookies();
    const token = cookieStore.get("mp_token")?.value || "";
    if (!token) return jsonError(401, "Not authenticated");
    const { uid } = decodeJwt<{ uid?: number }>(token) || {};
    if (!uid) return jsonError(401, "Not authenticated");

    const mr = await fetch(`${env.API_BASE_URL}/month_results/${uid}/${year}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const mrJs = await mr.json().catch(() => null);
    if (!mr.ok) return jsonError(mr.status, mrJs?.detail || "month-results failed");
    const rows: any[] = Array.isArray(mrJs) ? mrJs : [];

    if (mode === "MONTH") {
      if (!Number.isFinite(month) || month < 1 || month > 12)
        return jsonError(422, "month is required (1–12)");
      const row = rows.find((r) => Number(r.month) === month) ?? null;
      const income = Number(row?.income ?? 0) || 0;
      const expense = Number(row?.expense ?? 0) || 0;

      // นับจำนวนธุรกรรมเดือนนั้น
      const tr = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const trJs = await tr.json().catch(() => null);
      const txAll = Array.isArray(trJs?.transactions) ? trJs.transactions : [];
      const txRows = txAll.filter((r: any) => {
        const d = new Date(r.date);
        const inYM = d.getFullYear() === year && d.getMonth() + 1 === month;
        const typeOk = type === "all" ? true : r.type === type;
        return inYM && typeOk;
      });

      return Response.json({
        ok: true,
        data: { summary: { income, expense, balance: income - expense, transactions: txRows.length } },
      });
    }

    // RANGE (ย่อ): รวมทั้งปี
    const income = rows.reduce((s, r) => s + (Number(r.income) || 0), 0);
    const expense = rows.reduce((s, r) => s + (Number(r.expense) || 0), 0);

    const tr = await fetch(`${env.API_BASE_URL}/transactions/${uid}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const trJs = await tr.json().catch(() => null);
    const txAll = Array.isArray(trJs?.transactions) ? trJs.transactions : [];
    const txRows = txAll.filter((r: any) => new Date(r.date).getFullYear() === year);

    return Response.json({
      ok: true,
      data: { summary: { income, expense, balance: income - expense, transactions: txRows.length } },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}