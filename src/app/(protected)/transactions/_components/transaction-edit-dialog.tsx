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
import { Calendar as CalendarIcon, Pencil, Plus, Trash2 } from "lucide-react";
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

// 🔥 NEW: import select ui + textarea? (ไม่มี textarea ที่นี่ แต่เราต้องใช้ Select)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 🔥 NEW: คุณมี hook useTags ใน UploadImage
import { useTags } from "@/hooks/use-tags";

// 🔥 NEW: util สำหรับข้อความ error ที่ไม่ any
function getErrorMessage(err: unknown, fallback = "เกิดข้อผิดพลาด"): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  return fallback;
}

// 🔥 NEW: กันลบหมวด default
const DEFAULT_TAGS = new Set(["รายรับอื่นๆ", "รายจ่ายอื่นๆ"]);

/* ───────────────────────────────── Zod schema ─────────────────────────────────
 * - ใช้ z.coerce เพื่อรองรับค่า string/unknown จากอินพุต แล้วแปลงเป็นชนิดที่ต้องการ
 * - แยก "input type" และ "output type" ชัดเจนเพื่อให้ react-hook-form รู้ชนิดตอน validate
 * --------------------------------------------------------------------------- */
const FormSchema = z.object({
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  note: z.string().max(500).optional(),
  date: z.coerce.date(), // รับ unknown แล้ว coerce เป็น Date
  time: z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง (HH:MM)"),
  tag_id: z.coerce
    .number()
    .refine(Number.isFinite, { message: "กรุณาเลือกหมวดหมู่" })
    .int({ message: "กรุณาเลือกหมวดหมู่" })
    .positive({ message: "กรุณาเลือกหมวดหมู่" }),

  // 🔥 NEW: ประเภทรายรับ/รายจ่าย -> เพื่อกรองแท็ก
  type: z.enum(["income", "expense"]),
});

// ชนิดที่ form รับเข้ามาก่อน coerce (ตรงกับค่าจากอินพุต)
// type FormInput = z.input<typeof FormSchema>;
// ชนิดที่ได้หลังผ่าน resolver (ใช้ใน onSubmit)
type FormOutput = z.output<typeof FormSchema>;

/* ─────────────────────────────────── Props ───────────────────────────────────
 * - defaultValues มาจาก row เดิมในตาราง → เก็บ date เป็น string (YYYY-MM-DD)
 * - รองรับ size ปุ่ม trigger ทั้งแบบไอคอนและขนาดมาตรฐาน
 * --------------------------------------------------------------------------- */
type Props = {
  id: string;
  defaultValues: {
    amount: number;
    note?: string;
    date: string; // "YYYY-MM-DD"
    time?: string; // "HH:MM"
    // 🔥 NEW:
    tag_id: number; // หมวดหมู่ปัจจุบันของรายการนี้
    type: "income" | "expense"; // ประเภทปัจจุบันของรายการนี้
  };
  onUpdated?: () => void; // เผื่อให้ผู้ใช้ component ส่ง callback มาเอง
  size?: "icon" | "sm" | "default";
};

/* ─────────────────────────────── Component ─────────────────────────────── */
export default function TransactionEditDialog({
  id,
  defaultValues,
  // onUpdated,
  size = "icon",
}: Props) {
  const [open, setOpen] = React.useState(false);

  // 🔥 NEW: state สำหรับเพิ่มหมวดใหม่ + ลบหมวด
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  // 🔥 NEW: ดึง tags ทั้งหมดจากระบบ (ใช้ hook เดิมของคุณ)
  const { tags, mutate } = useTags();

  /* ------------------------------------------------------------------------
   * useForm:
   * - ใช้ resolver ที่ map FormInput -> FormOutput (ผ่าน zodResolver)
   * - ตั้ง defaultValues เป็น “input shape” (date เป็น string)
   * - mode: "onChange" ให้ feedback เร็ว ระหว่างพิมพ์
   * --------------------------------------------------------------------- */
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<FormOutput>({
    resolver: zodResolver(FormSchema) as unknown as Resolver<FormOutput>,
    defaultValues: {
      amount: defaultValues.amount,
      note: defaultValues.note ?? "",
      date: toDate(defaultValues.date) ?? new Date(), // ให้ค่าเป็น Date เพื่อสอดคล้องกับ FormOutput
      time: (defaultValues.time ?? "12:00").slice(0, 5),
      // 🔥 NEW:
      tag_id: defaultValues.tag_id,
      type: defaultValues.type,
    },
    mode: "onChange",
  });

  // 🔥 NEW: ใช้ watch เพื่องาน UI
  const selectedTagId = watch("tag_id");
  const type = watch("type");

  // 🔥 NEW: กรอง tags ตาม type ปัจจุบัน
  const typeTags = React.useMemo(
    () => tags.filter((t) => t.type === type),
    [tags, type]
  );

  /* ------------------------------------------------------------------------
   * onSubmit:
   * - ขณะนี้ values.date เป็น Date แล้ว (ผ่าน coerce)
   * - สร้าง payload ให้ตรง API (value, note, date: yyyy-MM-dd, time)
   * - แจ้ง global event "mp:transactions:changed" เพื่อให้หน้าอื่น sync
   * - ปิด dialog และ (ถ้าต้องการ) เรียก onUpdated จาก parent
   * --------------------------------------------------------------------- */
  async function onSubmit(values: FormOutput) {
    try {
      const payload = {
        value: values.amount,
        note: values.note ?? "",
        date: format(values.date, "yyyy-MM-dd"),
        time: values.time,
        // 🔥 NEW:
        tag_id: values.tag_id,
        type: values.type,
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

      // 📢 กระจายสัญญาณให้ส่วนอื่น ๆ ที่ฟังเหตุการณ์นี้อยู่ (dashboard/รายงาน ฯลฯ)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:transactions:changed", {
            detail: { reason: "edit" },
          })
        );
      }

      setOpen(false);
      // onUpdated?.(); // คงไว้เป็น option เผื่อ parent ต้องการ hook เอง
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : "ไม่ทราบสาเหตุ";
      toast.error("อัปเดตไม่สำเร็จ", { description: message });
    }
  }

  /* ------------------------------------------------------------------------
   * sync defaultValues → ฟอร์ม: เมื่อ dialog ถูกปิด แล้วเปิดใหม่
   * - ป้องกันค่าเก่า “ค้าง” ในฟอร์ม หากผู้ใช้เปิดปิดหลายครั้ง
   * --------------------------------------------------------------------- */
  React.useEffect(() => {
    if (!open) {
      reset({
        amount: defaultValues.amount,
        note: defaultValues.note ?? "",
        date: toDate(defaultValues.date) ?? new Date(), // ให้ค่าเป็น Date เพื่อสอดคล้องกับ FormOutput
        time: (defaultValues.time ?? "12:00").slice(0, 5),
        // 🔥 NEW:
        tag_id: defaultValues.tag_id,
        type: defaultValues.type,
      });
    }
  }, [open, defaultValues, reset]);

  /* ------------------------------------------------------------------------
   * addCategory(): เพิ่มหมวดใหม่ให้ type ปัจจุบัน
   * --------------------------------------------------------------------- */
  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/tags/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: name, type }), // type จาก watch("type")
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const msg =
          (json && "error" in json && json.error?.message) ||
          "เพิ่มหมวดหมู่ไม่สำเร็จ";
        throw new Error(msg);
      }

      toast.success("เพิ่มหมวดหมู่สำเร็จ");
      setNewCategoryName("");
      setIsAddingCategory(false);
      await mutate(); // reload tags (useTags)
    } catch (err: unknown) {
      toast.error("เพิ่มหมวดหมู่ไม่สำเร็จ", {
        description: getErrorMessage(err, "เกิดข้อผิดพลาด"),
      });
    }
  }

  /* ------------------------------------------------------------------------
   * deleteCategory(): ลบหมวดที่เลือก
   * --------------------------------------------------------------------- */
  async function deleteCategory() {
    const selectedIdNum = Number(selectedTagId || 0);
    const tag = tags.find((t) => t.id === selectedIdNum);
    if (!tag) return;

    if (DEFAULT_TAGS.has(tag.tag)) {
      toast.error("ไม่สามารถลบหมวดหมู่เริ่มต้นได้");
      return;
    }

    const ok = window.confirm(
      `ต้องการลบหมวดหมู่ “${tag.tag}” หรือไม่?\nธุรกรรมทั้งหมดจะถูกย้ายไปหมวดเริ่มต้นของประเภทเดียวกัน`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/tags/delete/${tag.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const msg =
          (json && "error" in json && json.error?.message) ||
          "ลบหมวดหมู่ไม่สำเร็จ";
        throw new Error(msg);
      }

      toast.success("ลบหมวดหมู่สำเร็จ");
      await mutate(); // reload tag list
      setValue("tag_id", undefined as unknown as number, {
        shouldValidate: true,
      });
    } catch (err: unknown) {
      toast.error("ลบหมวดหมู่ไม่สำเร็จ", {
        description: getErrorMessage(err, "เกิดข้อผิดพลาด"),
      });
    } finally {
      setDeleting(false);
    }
  }

  /* ------------------------------------------------------------------------
   * toDate: แปลงค่าที่อาจเป็น string/Date/undefined → Date | undefined
   * - ใช้สำหรับ Calendar และแสดงผลบนปุ่มเลือกวันที่
   * - รองรับทั้งรูปแบบ "YYYY-MM-DD" และ ISO string
   * --------------------------------------------------------------------- */
  function toDate(v: unknown): Date | undefined {
    if (!v) return undefined;
    if (v instanceof Date) return v;
    const s = String(v);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger: ปุ่มแก้ไข (รองรับ size แบบไอคอน/อื่น ๆ) */}
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

        {/* ฟอร์มหลัก: ใช้ Controller เพื่อคุมค่าที่ต้องแปลง/format เอง */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div>
            <Label>จำนวนเงิน (THB)</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => {
                // บังคับ value ให้เป็น string เสมอ เพื่อให้ input controlled
                const value =
                  field.value === undefined || field.value === null
                    ? ""
                    : String(field.value);

                return (
                  <>
                    <Input
                      // ❗️อย่า spread field ตรง ๆ (เพราะ field.value เป็น unknown)
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={value}
                      onChange={(e) => field.onChange(e.target.value)} // ให้ z.coerce.number จัดการตอน validate
                      inputMode="decimal"
                      type="text" // ดีสำหรับ mobile + รองรับทศนิยม/ลูกน้ำ
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
            {/* Date picker: เก็บใน form เป็น Date และแสดง/เลือกเป็น Date */}
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
                          // เก็บกลับเข้า form เป็น Date
                          onSelect={(d) => d && field.onChange(d)}
                          initialFocus
                          locale={th}
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </div>

            {/* Time input: ใช้ชนิด time (step 60 วินาที) */}
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

          {/* 🔥 NEW: Category & Type block (ใส่ไว้ "เหนือรายละเอียดโน้ต") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>หมวดหมู่ *</Label>

              <div className="flex items-center gap-2">
                {/* ปุ่มเข้าโหมดเพิ่มหมวด */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingCategory(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> เพิ่มหมวดหมู่
                </Button>

                {/* ปุ่มลบหมวด ถ้ามีเลือกอยู่ */}
                {selectedTagId ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={deleteCategory}
                    disabled={deleting}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    {deleting ? "กำลังลบ..." : "ลบหมวดหมู่"}
                  </Button>
                ) : null}
              </div>
            </div>

            {/* ประเภท (รายรับ/รายจ่าย) */}

            <Label>ประเภท *</Label>
            <div className="flex flex-row items-start">
              <div className="flex-none mr-3">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        // เปลี่ยน type แล้วต้องเคลียร์ tag_id เพราะหมวดเปลี่ยนเซ็ต
                        field.onChange(val);
                        setValue("tag_id", undefined as unknown as number, {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">รายรับ</SelectItem>
                        <SelectItem value="expense">รายจ่าย</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.type.message as string}
                  </p>
                )}
              </div>

              {/* โหมดกำลังเพิ่มหมวดใหม่ */}
              <div className="flex-none">
                {isAddingCategory ? (
                  <div className="flex gap-2 ml-0.5">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="ชื่อหมวดหมู่ใหม่"
                    />
                    <Button
                      type="button"
                      onClick={addCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      เพิ่ม
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName("");
                      }}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                ) : (
                  // ดรอปดาวน์เลือกหมวดตาม type
                  <Controller
                    control={control}
                    name="tag_id"
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              typeTags.length === 0
                                ? "ยังไม่มีหมวดหมู่ — เพิ่มหมวดหมู่ก่อน"
                                : "เลือกหมวดหมู่"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">
                          {typeTags.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              ยังไม่มีหมวดหมู่ของประเภทนี้
                            </div>
                          ) : (
                            typeTags.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.tag}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}

                {errors.tag_id && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.tag_id.message as string}
                  </p>
                )}
              </div>
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

