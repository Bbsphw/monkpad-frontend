// src/components/charts/custom-tooltip.tsx
"use client";

import type { CSSProperties } from "react";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipProps } from "recharts/types/component/Tooltip";

function toNumberFromValueType(v: ValueType): number {
  // ValueType = number | string | (number | string)[]
  if (Array.isArray(v)) {
    const first = v[0];
    return typeof first === "string" ? Number(first) : Number(first);
  }
  return typeof v === "string" ? Number(v) : Number(v);
}

export const currencyTooltipValueFormatter: (
  v: ValueType,
  n?: NameType
) => string = (v) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(
    toNumberFromValueType(v)
  );

export const numberTooltipValueFormatter: (
  v: ValueType,
  n?: NameType
) => string = (v) =>
  new Intl.NumberFormat("th-TH").format(toNumberFromValueType(v));

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
  if (!active || !payload?.length) return null;

  const displayedLabel = labelFormatter ? labelFormatter(label) : String(label);

  return (
    <div
      className="rounded-md border bg-popover p-2 text-popover-foreground shadow-sm"
      style={wrapperStyle}
    >
      <div className="mb-1 text-xs text-muted-foreground">{displayedLabel}</div>
      {payload.map((p) => {
        const n = p.name as NameType;
        const v = p.value as ValueType;
        const formatted = valueFormatter ? valueFormatter(v, n) : String(v);
        return (
          <div key={String(n)} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ background: p.color }}
            />
            <span className="font-medium">{n}</span>
            <span className="ml-auto tabular-nums">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}
