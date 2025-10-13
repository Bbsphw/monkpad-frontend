'use client';
import React from 'react';
import { applyColors, DEFAULT_OTHERS_COLOR } from './color-utils';

/* ===== Types ===== */
export interface ExpenseSlice {
  name: string;
  value: number;
  color?: string; // optional เพื่อให้ applyColors เติมให้
}

interface Props {
  /** รายการดิบทั้งหมด (ก่อนบีบอัด) — จะแสดงครบทุกแถว */
  slices: ExpenseSlice[];
  /** รายชื่อ "สมาชิกที่ถูกยุบเข้า 'อื่นๆ'" จากขั้นตอน compress ใน parent */
  othersMembers: string[];
  /** สีของ 'อื่นๆ' ที่อยากใช้กับสมาชิกที่ถูกยุบ (ดีฟอลต์ gray-400) */
  othersColor?: string;
  /** จะเรียงลิสต์อย่างไร: 'none' = ตามลำดับเดิม, 'desc' = จากมากไปน้อย */
  order?: 'none' | 'desc';
}

/* ===== Utils ===== */
const currency = (n: number): string =>
  `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;

const percent = (p: number): string =>
  `${p.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`;

export const ExpenseBar: React.FC<Props> = ({
  slices,
  othersMembers,
  othersColor = DEFAULT_OTHERS_COLOR,
  order = 'none',
}) => {
  // เติมสีอัตโนมัติจากพาเลต (ไม่สร้างแถว 'อื่นๆ' เพิ่ม)
  const colored = applyColors(slices);

  // เลือกเรียงลำดับ (ถ้าอยากให้ตรงกับพาย ให้ใช้ 'desc')
  const data =
    order === 'desc'
      ? [...colored].sort((a, b) => b.value - a.value)
      : colored;

  const total = data.reduce((s, r) => s + r.value, 0);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-600">การวิเคราะห์หมวดหมู่รายจ่าย</h2>
      <ul className="space-y-2 text-sm">
        {data.map((s) => {
          const pct = (s.value / total) * 100;

          // ถ้ารายการนี้ถูกยุบเข้า "อื่นๆ" → ใช้สี 'อื่นๆ'
          const dotColor = othersMembers.includes(s.name) ? othersColor : s.color!;

          return (
            <li key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: dotColor }}
                />
                {s.name}
              </span>
              <span className="tabular-nums">
                {currency(s.value)}{' '}
                <span className="ml-2 text-gray-500">{percent(pct)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
