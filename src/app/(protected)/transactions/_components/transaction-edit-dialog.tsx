// src/app/(protected)/transactions/_components/transaction-edit-dialog.tsx

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

/* ----------------- Zod schema ----------------- */
const FormSchema = z.object({
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  note: z.string().max(500).optional(),
  date: z.coerce.date(), // <- รับ unknown, คืน Date
  time: z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง (HH:MM)"),
});

// 🔥 สำคัญ: แยกชนิด input/output ของ schema
type FormInput = z.input<typeof FormSchema>; // ก่อน coerce: amount/date เป็น unknown
type FormOutput = z.output<typeof FormSchema>; // หลัง coerce: amount:number, date:Date

/* ----------------- Props ----------------- */
type Props = {
  id: string;
  defaultValues: {
    amount: number;
    note?: string;
    date: string; // "YYYY-MM-DD"
    time?: string; // "HH:MM"
  };
  onUpdated?: () => void;
  size?: "icon" | "sm" | "default";
};

/* ----------------- Component ----------------- */
export default function TransactionEditDialog({
  id,
  defaultValues,
  // onUpdated,
  size = "icon",
}: Props) {
  const [open, setOpen] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormInput, any, FormOutput>({
    // ให้ resolver map จาก FormInput -> FormOutput
    resolver: zodResolver(FormSchema) as Resolver<FormInput, any, FormOutput>,
    // ใช้รูปแบบ "input" สำหรับ defaultValues (date เป็น string)
    defaultValues: {
      amount: defaultValues.amount,
      note: defaultValues.note ?? "",
      date: defaultValues.date, // "YYYY-MM-DD"
      time: (defaultValues.time ?? "12:00").slice(0, 5), // "HH:MM"
    },
    mode: "onChange",
  });

  async function onSubmit(values: FormOutput) {
    try {
      // values.date ณ จุดนี้เป็น Date แล้ว (เพราะผ่าน coerce)
      const payload = {
        value: values.amount,
        note: values.note ?? "",
        date: format(values.date, "yyyy-MM-dd"),
        time: values.time,
      };

      const res = await fetch(`/api/transactions/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const js = await res.json().catch(() => null);
      if (!res.ok || !js?.ok) {
        throw new Error(js?.error?.message || "อัปเดตไม่สำเร็จ");
      }

      toast.success("อัปเดตรายการแล้ว");
      // ✅ แจ้งทุกที่ว่า transactions เปลี่ยน
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:transactions:changed", {
            detail: { reason: "edit" },
          })
        );
      }

      setOpen(false);
      // onUpdated?.();
    } catch (e: any) {
      toast.error("อัปเดตไม่สำเร็จ", { description: e?.message });
    }
  }

  // reset ค่า form ให้ตรง defaultValues ล่าสุดเมื่อ dialog ปิด/เปิดใหม่
  React.useEffect(() => {
    if (!open) {
      reset({
        amount: defaultValues.amount,
        note: defaultValues.note ?? "",
        date: defaultValues.date, // string
        time: (defaultValues.time ?? "12:00").slice(0, 5),
      });
    }
  }, [open, defaultValues, reset]);

  // helper: แปลงค่า date (string | Date | undefined) ให้เป็น Date สำหรับ Calendar / แสดงผล
  function toDate(v: unknown): Date | undefined {
    if (!v) return undefined;
    if (v instanceof Date) return v;
    const s = String(v);
    // รองรับทั้ง "YYYY-MM-DD" และ ISO
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={size} aria-label="แก้ไขรายการ">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขรายการ</DialogTitle>
          <DialogDescription>
            อัปเดตจำนวนเงิน วันที่ เวลา และรายละเอียด
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div>
            <Label>จำนวนเงิน (THB)</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => {
                const value =
                  field.value === undefined || field.value === null
                    ? ""
                    : String(field.value); // ← แปลงให้เป็น string เสมอ

                return (
                  <>
                    <Input
                      // ❗️อย่า spread field ตรง ๆ เพราะ value: unknown
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      // เก็บเป็น string ในอินพุต ให้ z.coerce.number จัดการเองตอน submit/validate
                      value={value}
                      onChange={(e) => field.onChange(e.target.value)}
                      inputMode="decimal"
                      type="text" // รองรับทศนิยม/ลูกน้ำได้ดีสุดบน mobile + desktop
                      placeholder="0.00"
                    />
                    {fieldState.error && (
                      <p className="text-xs text-destructive mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                );
              }}
            />
          </div>
          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>วันที่</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => {
                  const selected = toDate(field.value);
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className={cn(
                            "w-full justify-start",
                            !selected && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selected
                            ? format(selected, "dd MMM yyyy", { locale: th })
                            : "เลือกวันที่"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selected}
                          // เก็บกลับเป็น string "YYYY-MM-DD" (อินพุตของ schema)
                          onSelect={(d) =>
                            d && field.onChange(format(d, "yyyy-MM-dd"))
                          }
                          initialFocus
                          locale={th}
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>เวลา</Label>
              <Controller
                name="time"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input {...field} type="time" step={60} />
                    {fieldState.error && (
                      <p className="text-xs text-destructive mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <Label>รายละเอียด</Label>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="โน้ตเพิ่มเติม (ถ้ามี)" />
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
