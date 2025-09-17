"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

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
  const [show, setShow] = useState<boolean>(false);
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          {...field}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          aria-invalid={!!error}
          className="pr-10"
          {...inputProps}
        />
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
      {error ? (
        <p className="text-sm text-destructive">{String(error.message)}</p>
      ) : null}
    </div>
  );
}
