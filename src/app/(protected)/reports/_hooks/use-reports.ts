// src/app/(protected)/reports/_hooks/use-reports.ts

"use client";

import * as React from "react";
import type { ReportData } from "../_types/reports";
import { getReports } from "../_services/reports-service";

export function useReports(params: {
  year: number;
  month: number;
  type: "income" | "expense" | "all";
}) {
  const { year, month, type } = params;

  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReports({ year, month, type });
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "Load reports failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month, type]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
