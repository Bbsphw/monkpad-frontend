// src/hooks/use-tags.ts

"use client";

import useSWR from "swr";

export type Tag = {
  id: number;
  tag: string;
  type: "income" | "expense";
  value?: number;
};

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/tags/me", { cache: "no-store" });
  const js = await res.json().catch(() => null);
  if (!res.ok || !js?.ok)
    throw new Error(js?.error?.message || "Fetch tags failed");
  return Array.isArray(js.data) ? (js.data as Tag[]) : [];
}

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR(["tags/me"], fetchTags, {
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
  });

  return {
    tags: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    reload: () => mutate(),
    mutate,
  };
}
