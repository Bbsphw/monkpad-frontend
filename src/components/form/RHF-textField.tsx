"use client";

import type { ComponentProps } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        {...field}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...inputProps}
      />
      {error ? (
        <p className="text-sm text-destructive">{String(error.message)}</p>
      ) : null}
    </div>
  );
}
