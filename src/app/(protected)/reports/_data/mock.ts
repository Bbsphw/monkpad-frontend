import type { ReportData } from "../_hooks/use-reports";
import type { MonthlyPoint } from "../_components/column-bar-chart";
import type { CategoryPoint } from "../_components/bar-trend-chart";

/* ------------------------- helpers ------------------------- */
const monthLabel = (y: number, m: number) =>
  `${String(m).padStart(2, "0")}/${String(y).slice(-2)}`;

function monthsBetween(
  start: { y: number; m: number },
  end: { y: number; m: number }
) {
  const out: { y: number; m: number }[] = [];
  const d = new Date(start.y, start.m - 1, 1);
  const last = new Date(end.y, end.m - 1, 1);
  while (d <= last) {
    out.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

/* -------------------------- mock --------------------------- */
export function mockReport(params: {
  mode: "MONTH" | "RANGE";
  year: number;
  month: number;
  type: "all" | "income" | "expense";
  rangeStart?: { year: number; month: number };
  rangeEnd?: { year: number; month: number };
}): ReportData {
  const baseDate = new Date(params.year, params.month - 1, 1);

  // ── Monthly series: รายรับ/รายจ่ายรายเดือน (12 เดือนย้อนหลัง)
  const months: { label: string; y: number; m: number }[] = Array.from({
    length: 12,
  }).map((_, idx) => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() - (11 - idx));
    return {
      label: monthLabel(d.getFullYear(), d.getMonth() + 1),
      y: d.getFullYear(),
      m: d.getMonth() + 1,
    };
    // label เช่น "01/67"
  });

  const monthlySeries: MonthlyPoint[] = months.map(({ label }) => {
    const base = 6000 + Math.round(Math.random() * 5000);
    const income = base + Math.round(Math.random() * 5000);
    const expense = Math.max(500, base - Math.round(Math.random() * 2500));
    return { month: label, income, expense };
  });

  // ── Summary ใช้เดือนล่าสุด
  const current = monthlySeries[monthlySeries.length - 1];
  const summary = {
    income: current.income,
    expense: current.expense,
    balance: current.income - current.expense,
    transactions: 40 + Math.floor(Math.random() * 30),
  };

  // ── Category Series: รวมรายจ่ายตามหมวด (อิงช่วงที่เลือกแบบหยาบ)
  const categories = [
    "ภาษี/ค่าธรรมเนียม (Tax)",
    "อาหาร/เครื่องดื่ม",
    "เดินทาง",
    "ที่อยู่อาศัย",
    "การศึกษา",
    "สุขภาพ",
    "บันเทิง",
    "ของใช้จิปาถะ",
    "ของฝาก/บริจาค",
    "อื่น ๆ",
  ];

  // คิดจำนวนเดือนตามโหมดที่เลือก เพื่อปรับ scale ของ mock
  const monthSet =
    params.mode === "MONTH"
      ? [{ y: baseDate.getFullYear(), m: baseDate.getMonth() + 1 }]
      : monthsBetween(
          {
            y: params.rangeStart?.year ?? params.year,
            m: params.rangeStart?.month ?? params.month,
          },
          {
            y: params.rangeEnd?.year ?? params.year,
            m: params.rangeEnd?.month ?? params.month,
          }
        );

  const categorySeries: CategoryPoint[] = categories.map((c, idx) => {
    // base expense ต่อหมวด × จำนวนเดือนที่เลือก
    const perMonth = 800 + Math.round(Math.random() * 1200) + idx * 30;
    const expense =
      monthSet.length * perMonth + Math.round(Math.random() * 2000);
    return { category: c, expense };
  });

  return { summary, monthlySeries, categorySeries };
}
