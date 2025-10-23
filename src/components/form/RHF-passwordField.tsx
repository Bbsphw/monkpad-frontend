// src/components/form/RHF-passwordField.tsx

"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

/**
 * Props ของฟิลด์รหัสผ่านแบบ React Hook Form
 * - สืบทอด props ของ <Input> (ยกเว้น `type` เพราะเราควบคุมเอง show/hide)
 * - ต้องมี control (จาก useForm) และ name (path ของฟิลด์)
 */
export interface RHFPasswordFieldProps<T extends FieldValues>
  extends Omit<ComponentProps<typeof Input>, "type"> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
}

export default function RHFPasswordField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  ...inputProps
}: RHFPasswordFieldProps<T>) {
  // state ภายใน: ใช้สลับมองเห็น/ซ่อนรหัสผ่าน
  const [show, setShow] = useState<boolean>(false);

  // useController: ผูกฟิลด์กับ RHF เพื่อได้ field (value, onChange, ref) และ error
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  return (
    <div className="space-y-2">
      {/* Label ผูกกับ input ผ่าน htmlFor = id เดียวกัน เพื่อ A11y */}
      <Label htmlFor={name}>{label}</Label>

      <div className="relative">
        {/* ช่องกรอกรหัสผ่าน
           - ใช้ type ตามสถานะ show (text/password)
           - aria-invalid เมื่อมี error เพื่อ A11y
           - padding-right เผื่อที่ให้ปุ่มตา (pr-10) */}
        <Input
          id={name}
          {...field}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          aria-invalid={!!error}
          className="pr-10"
          {...inputProps}
        />

        {/* ปุ่ม toggle แสดง/ซ่อนรหัสผ่าน
           - ใช้ variant ghost ไม่ให้มีพื้นหลังรบกวน
           - ตำแหน่ง absolute ชิดขวาและกดได้เต็มความสูง input
           - aria-label/aria-pressed ช่วยบอกสถานะให้เครื่องอ่านหน้าจอ */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShow((v) => !v)}
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          aria-pressed={show}
        >
          {show ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* ข้อความ error ใต้ช่อง เมื่อ validate ไม่ผ่าน */}
      {error ? (
        <p className="text-sm text-destructive">{String(error.message)}</p>
      ) : null}
    </div>
  );
}
