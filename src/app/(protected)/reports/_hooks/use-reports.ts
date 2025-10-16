"use client";

import * as React from "react";
import { getReport } from "../_services/report-service";
import { mockReport } from "../_data/mock";
import type { Summary } from "../_components/report-cards";
import type { MonthlyPoint } from "../_components/column-bar-chart";
import type { CategoryPoint } from "../_components/bar-trend-chart";

export type ReportData = {
  summary: Summary;
  monthlySeries: MonthlyPoint[]; // สำหรับ ColumnBarChart (รายเดือน)
  categorySeries: CategoryPoint[]; // ✅ สำหรับ BarTrendChart (วิเคราะห์หมวด)
};

type Params = {
  mode: "MONTH" | "RANGE";
  year: number;
  month: number;
  rangeStart?: { year: number; month: number };
  rangeEnd?: { year: number; month: number };
  type: "all" | "income" | "expense";
};

export function useReports(params: Params) {
  const [data, setData] = React.useState<ReportData | null>(null);
  const [isLoading, setLoading] = React.useState(true);
  const [isError, setError] = React.useState(false);

  const fetcher = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await getReport(params);
      setData(res ?? mockReport(params));
    } catch {
      setData(mockReport(params));
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [params]);

  React.useEffect(() => {
    fetcher();
  }, [fetcher]);

  return { data, isLoading, isError, refetch: fetcher };
}
