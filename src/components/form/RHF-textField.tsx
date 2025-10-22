// src/components/form/RHF-textField.tsx

"use client";

import type { ComponentProps } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * ฟิลด์ข้อความ generic สำหรับ React Hook Form
 * - รองรับทุกชนิดฟอร์มด้วย generic <T extends FieldValues>
 * - รับ control + name เพื่อเชื่อมกับ RHF
 * - สืบทอด props ของ <Input> ได้เต็ม ๆ
 */
export interface RHFTextFieldProps<T extends FieldValues>
  extends ComponentProps<typeof Input> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
}

export default function RHFTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  ...inputProps
}: RHFTextFieldProps<T>) {
  // ผูกฟิลด์กับ RHF และอ่าน error state
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  return (
    <div className="space-y-2">
      {/* ผูก Label กับ input id เดียวกันเพื่อ A11y */}
      <Label htmlFor={name}>{label}</Label>

      {/* ช่องกรอกข้อความทั่วไป
         - กระจาย field เพื่อได้ value, onChange, onBlur, ref
         - แสดง aria-invalid เมื่อมี error */}
      <Input
        id={name}
        {...field}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...inputProps}
      />

      {/* แสดงข้อความ error (ถ้ามี) */}
      {error ? (
        <p className="text-sm text-destructive">{String(error.message)}</p>
      ) : null}
    </div>
  );
}
