'use client';
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

export interface ExpenseSlice { name: string; value: number; color: string; }
interface Props { slices: ExpenseSlice[]; }

const currency = (n: number) => `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
const percent  = (p: number) => `${p.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`;

export const ExpensePie: React.FC<Props> = ({ slices }) => {
  const total = slices.reduce((s, r) => s + r.value, 0);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-600">สัดส่วนรายจ่าย</h2>
      <div className="h-[280px] w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              label={(e) => `${e.name} ${Math.round((e.value / total) * 100)}%`}
              labelLine
            >
              {slices.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
            <Tooltip
              formatter={(v: ValueType, n: NameType, ctx) => [
                currency(v as number),
                `${n} (${percent(((ctx?.payload?.value as number) / total) * 100)})`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
