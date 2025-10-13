'use client';
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  TooltipProps,
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

/* ===== Types (ภายในไฟล์) ===== */
export interface MonthRow {
  month: string;
  income: number;
  expense: number;
}

interface Props {
  data: MonthRow[];
  highlightMonth?: string;
}

/* ===== Utils ===== */
const currency = (n: number): string =>
  `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;

/* ===== Custom Tooltip (Typed) ===== */
const BarTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  const income = (payload.find((p) => p.dataKey === 'income')?.value as number) ?? 0;
  const expense = (payload.find((p) => p.dataKey === 'expense')?.value as number) ?? 0;

  return (
    <div className="rounded-lg border bg-white/90 p-3 shadow">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 space-y-1 text-sm">
        <div className="text-emerald-600">รายรับ : {currency(income)}</div>
        <div className="text-rose-600">รายจ่าย : {currency(expense)}</div>
      </div>
    </div>
  );
};

export const BarComparison: React.FC<Props> = ({ data, highlightMonth }) => {
  const sepIdx = data.findIndex((m) => m.month === highlightMonth);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-600">
        เปรียบเทียบรายรับรายจ่ายรายเดือน
      </h2>

      <div className="h-[280px] w-full">
        <ResponsiveContainer>
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => v.toLocaleString('th-TH')} />
            <Tooltip content={<BarTooltip />} />
            {sepIdx >= 0 && (
              <ReferenceArea
                x1={data[Math.max(0, sepIdx - 0.5)]?.month}
                x2={data[Math.min(data.length - 1, sepIdx + 0.5)]?.month}
                fill="#9CA3AF"
                fillOpacity={0.25}
                ifOverflow="visible"
              />
            )}
            <Bar dataKey="expense" name="รายจ่าย" radius={[6, 6, 0, 0]} fill="#EF4444" />
            <Bar dataKey="income" name="รายรับ" radius={[6, 6, 0, 0]} fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
