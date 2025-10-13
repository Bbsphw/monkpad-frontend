'use client';
import React, { useMemo } from 'react';
import { monthly, expenseSlices, highlightMonth } from './_data/mock';
import { BarComparison } from './_components/BarComparison';
import { ExpenseBar } from './_components/ExpenseBar';
import { ExpensePie } from './_components/ExpensePie';
import { applyColors, DEFAULT_OTHERS_COLOR } from './_components/color-utils';
import { compressSlicesWithMembers } from './_components/group-utils';

export default function ReportsPage() {
  const { display, othersMembers } = useMemo(
    () => compressSlicesWithMembers(expenseSlices, 10, 'อื่นๆ'),
    []
  );
  const pieData = useMemo(
    () => applyColors(display, { othersName: 'อื่นๆ' }),
    [display]
  )


  return (
    <div className="grid gap-6">
      {/* header */}
      

      {/* บน: Bar + Pie */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BarComparison data={monthly} highlightMonth={highlightMonth} />
        <ExpensePie slices={pieData as { name: string; value: number; color: string }[]} />

        {/* ล่าง: Legend ใช้ชุดเดียวกัน และบังคับให้สมาชิกที่ถูกรวม แสดงสีเดียวกับ 'อื่นๆ' */}
        <div className="lg:col-span-2">
          <ExpenseBar
            slices={expenseSlices}        // raw ครบทุกหมวด
            othersMembers={othersMembers} // รายชื่อที่ถูกยุบ
            othersColor={DEFAULT_OTHERS_COLOR}         // เทา (หรือสีอื่นก็ได้)
            order="desc"                  // (ถ้าต้องการเรียงมาก→น้อย)
          />
        </div>
      </div>
    </div>
  );
}
