// src/hooks/use-tags.ts

"use client";

import useSWR from "swr";

/**
 * Type หมวดหมู่รายรับ/รายจ่าย (Tag)
 */
export type Tag = {
  id: number;
  tag: string;
  type: "income" | "expense";
  /** optional สำหรับข้อมูลสรุปในกราฟหรือรายงาน */
  value?: number;
};

/**
 * ดึงข้อมูลหมวดหมู่ของผู้ใช้ปัจจุบัน
 * - ใช้ SWR cache key = ["tags/me"]
 * - ป้องกัน cache stale ด้วย dedupingInterval
 * - ปลอดภัยต่อ fetch error
 */
async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/tags/me", {
    cache: "no-store", // 🚫 ปิดการ cache ของ Next.js (เราจะให้ SWR จัดการเอง)
  });

  const js = await res.json().catch(() => null);
  if (!res.ok || !js?.ok) {
    throw new Error(js?.error?.message || "ดึงข้อมูลหมวดหมู่ไม่สำเร็จ");
  }

  // ✅ ตรวจสอบรูปแบบข้อมูลก่อนส่งออก
  return Array.isArray(js.data) ? (js.data as Tag[]) : [];
}

/**
 * Hook สำหรับจัดการข้อมูลหมวดหมู่ (tags)
 * - ใช้ SWR จัดการ caching / revalidation
 * - ให้ method reload() และ mutate() สำหรับ refresh data
 * - ปิดการ revalidate บางจังหวะเพื่อประสิทธิภาพ
 */
export function useTags() {
  const { data, error, isLoading, mutate } = useSWR(["tags/me"], fetchTags, {
    dedupingInterval: 10_000, // ⏱️ ป้องกัน re-fetch ถี่เกินไปภายใน 10 วิ
    revalidateOnFocus: false, // 🚫 ไม่ revalidate ทุกครั้งที่ focus กลับมาที่หน้า
    revalidateOnReconnect: false, // 🚫 ไม่ fetch ใหม่เมื่อเชื่อมต่อเน็ตกลับมา
    keepPreviousData: true, // ✅ เก็บข้อมูลเก่าไว้ระหว่าง revalidate เพื่อให้ UI ไม่กระตุก
  });

  return {
    tags: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    /** reload = เรียก mutate() เพื่อ refresh ข้อมูลแบบ manual */
    reload: () => mutate(),
    mutate,
  };
}
