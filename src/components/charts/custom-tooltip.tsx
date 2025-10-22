// src/components/charts/custom-tooltip.tsx

"use client";

import type { CSSProperties } from "react";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipProps } from "recharts/types/component/Tooltip";

/**
 * แปลงค่า ValueType ของ Recharts ให้เป็น number แบบปลอดภัย
 * - ValueType อาจเป็น number | string | (number|string)[]
 * - กรณีเป็น array จะหยิบค่าตัวแรก (ตามสัญญา Recharts ที่บาง series อาจส่งหลายค่า)
 */
function toNumberFromValueType(v: ValueType): number {
  // ValueType = number | string | (number | string)[]
  if (Array.isArray(v)) {
    const first = v[0];
    return typeof first === "string" ? Number(first) : Number(first);
  }
  return typeof v === "string" ? Number(v) : Number(v);
}

/**
 * ฟอร์แมตเป็นสกุลเงิน THB สำหรับ tooltip
 * - ใช้ Intl.NumberFormat เพื่อได้รูปแบบตาม locale/th-TH
 * - รองรับค่า string/array ตามที่ Recharts ส่งมา
 */
export const currencyTooltipValueFormatter: (
  v: ValueType,
  n?: NameType
) => string = (v) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(
    toNumberFromValueType(v)
  );

/**
 * ฟอร์แมตเป็นเลขธรรมดาแบบ th-TH
 */
export const numberTooltipValueFormatter: (
  v: ValueType,
  n?: NameType
) => string = (v) =>
  new Intl.NumberFormat("th-TH").format(toNumberFromValueType(v));

/**
 * CustomTooltip: กล่อง tooltip สำหรับกราฟ Recharts
 *
 * Props หลักจาก Recharts:
 * - active: แสดง/ซ่อนตามการ hover
 * - payload: รายการจุดข้อมูลที่ hover อยู่นั้น (หนึ่งหรือหลายซีรีส์)
 * - label: ป้ายหลักของแกน X/จุด (เช่น วันที่/เดือน/หมวดหมู่)
 *
 * Props เพิ่มเติมของเรา:
 * - valueFormatter: ฟังก์ชันแปลงค่าตัวเลขให้เป็นข้อความ (เช่น THB, จำนวน)
 * - labelFormatter: ฟังก์ชันแปลง label (เช่น format วันที่)
 * - wrapperStyle: ปรับสไตล์ภายนอกเพิ่มเติมได้
 */
export function CustomTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  wrapperStyle,
}: TooltipProps<ValueType, NameType> & {
  valueFormatter?: (v: ValueType, n?: NameType) => string;
  labelFormatter?: (l: unknown) => string;
  wrapperStyle?: CSSProperties;
}) {
  // ซ่อน tooltip เมื่อยังไม่ active หรือไม่มีข้อมูลให้แสดง
  if (!active || !payload?.length) return null;

  // เลือกใช้ labelFormatter หากส่งมา ไม่งั้น fallback เป็น String(label)
  const displayedLabel = labelFormatter ? labelFormatter(label) : String(label);

  return (
    <div
      className="rounded-md border bg-popover p-2 text-popover-foreground shadow-sm"
      style={wrapperStyle}
    >
      {/* แถวบน: ป้ายของแกน X/วันที่/ช่วงเวลา */}
      <div className="mb-1 text-xs text-muted-foreground">{displayedLabel}</div>

      {/* รายการค่าแต่ละซีรีส์ที่ตำแหน่งเดียวกัน (เช่น รายรับ/รายจ่าย) */}
      {payload.map((p) => {
        const n = p.name as NameType; // ชื่อซีรีส์
        const v = p.value as ValueType; // ค่าที่จุดนั้น
        const formatted = valueFormatter ? valueFormatter(v, n) : String(v);
        return (
          <div key={String(n)} className="flex items-center gap-2 text-sm">
            {/* จุดสีอิง p.color เพื่อบอกซีรีส์ */}
            <span
              className="inline-block size-2 rounded-sm"
              style={{ background: p.color }}
            />
            {/* ชื่อซีรีส์ */}
            <span className="font-medium">{n}</span>
            {/* ค่าที่ฟอร์แมตแล้ว ชิดขวาด้วย ml-auto + ใช้ tabular-nums ให้ตัวเลขเรียงคอลัมน์สวย */}
            <span className="ml-auto tabular-nums">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}
