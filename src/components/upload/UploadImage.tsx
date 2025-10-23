// src/components/upload/UploadImage.tsx

"use client";

import * as React from "react";
import Image from "next/image";
import { z } from "zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, UploadCloud, X, Plus, Scan, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTags } from "@/hooks/use-tags";

/* -------------------- Config -------------------- */
// จำกัดขนาดไฟล์ และชนิดไฟล์ที่รองรับ (เพื่อ UX ที่ดี/ป้องกันอัปโหลดไฟล์ไม่ถูกชนิด)
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
// หมวดหมู่ตั้งต้น (กันลบ)
const DEFAULT_TAGS = new Set(["รายรับอื่นๆ", "รายจ่ายอื่นๆ"]);

/* -------------------- Zod Schema -------------------- */
// schema หลักของฟอร์ม (รองรับ slip แบบ optional เพราะผู้ใช้อาจกรอกเอง)
const formSchema = z.object({
  slip: z
    .instanceof(File, { message: "โปรดอัปโหลดรูปสลิป" })
    .refine((file) => ACCEPTED_TYPES.includes(file.type), {
      message: "รองรับเฉพาะ PNG, JPG",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024, {
      message: `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`,
    })
    .optional(),

  type: z.enum(["income", "expense"]), // ประเภทธุรกรรม

  amount: z
    .union([z.string(), z.number()]) // รับได้ทั้ง string/number เพื่อรองรับ inputMode decimal
    .transform((v) => (typeof v === "string" ? Number(v.replace(/,/g, "")) : v))
    .refine((n) => Number.isFinite(n), { message: "จำนวนเงินไม่ถูกต้อง" })
    .refine((n) => n > 0, { message: "จำนวนเงินต้องมากกว่า 0" }),

  tag_id: z.coerce
    .number()
    .refine(Number.isFinite, { message: "กรุณาเลือกหมวดหมู่" })
    .int({ message: "กรุณาเลือกหมวดหมู่" })
    .positive({ message: "กรุณาเลือกหมวดหมู่" }),

  note: z.string().max(500, "รายละเอียดต้องไม่เกิน 500 ตัวอักษร").optional(),

  date: z.coerce.date().refine((d) => !isNaN(d.getTime()), {
    message: "กรุณาเลือกวันที่",
  }),

  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง (HH:MM)")
    .refine((t) => {
      const [hh, mm] = t.split(":").map(Number);
      return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
    }, "เวลาไม่ถูกต้อง (ช่วง 00:00–23:59)"),
});

// แยก input/output เพื่อบอก TS หลังผ่าน transform/coerce แล้วจะเป็นชนิดไหน
type UploadImageInput = z.input<typeof formSchema>;
type UploadImageOutput = z.output<typeof formSchema>;

/* -------------------- Types: API responses -------------------- */
type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error?: { message?: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

type OCRData = { amount?: number | string; date?: string; time?: string };
type OCRResp = ApiResp<OCRData>;

/* -------------------- Helpers (type-safe, no any) -------------------- */
function getErrorMessage(err: unknown, fallback = "เกิดข้อผิดพลาด"): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  return fallback;
}

/** แปลงค่าที่อาจเป็น Date/string/number/undefined → Date | undefined */
function toDate(v: UploadImageInput["date"]): Date | undefined {
  if (v instanceof Date) return v;
  if (typeof v === "number" || typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

interface UploadImageProps {
  onSuccess?: () => void; // callback หลังบันทึกสำเร็จ (ให้ parent ปิด dialog/refresh ได้)
}

export default function UploadImage({ onSuccess }: UploadImageProps) {
  /* -------------------- Local states -------------------- */
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ดึง tags จาก hook กลาง (ใช้ SWR ในตัว, มี mutate สำหรับรีโหลด)
  const { tags, mutate } = useTags();

  /* -------------------- React Hook Form -------------------- */
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<UploadImageInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // ใช้โครง input (ก่อน transform) → จึงส่ง string/undefined ได้
      type: "expense",
      amount: "",
      tag_id: "" as unknown as UploadImageInput["tag_id"], // ค่าเริ่มต้นเป็นค่าว่าง
      note: "",
      date: new Date(), // รับได้เพราะ coerce.date รองรับ Date ด้วย
      time: "12:00",
    },
    mode: "onChange",
  });

  // watch ค่าเพื่อแสดง/ปรับ UI
  const type = watch("type");
  const selectedTagId = watch("tag_id");
  const amount = watch("amount");

  // กรองหมวดตาม type ปัจจุบัน
  const typeTags = React.useMemo(
    () => tags.filter((t) => t.type === type),
    [tags, type]
  );

  // เมื่อเปลี่ยน type ให้รีเซ็ต tag_id เพื่อบังคับเลือกใหม่ (ป้องกันหมวดข้าม type)
  React.useEffect(() => {
    setValue("tag_id", "" as unknown as UploadImageInput["tag_id"], {
      shouldValidate: true,
    });
  }, [type, setValue]);

  /* -------------------- File / OCR handlers -------------------- */
  // ตั้งค่าไฟล์ + สร้าง/ล้าง objectURL สำหรับ preview (revoke กัน memory leak)
  const handleFileSelect = React.useCallback(
    (file: File | null) => {
      if (!file) {
        setPreview(null);
        setValue("slip", undefined, { shouldValidate: true });
        return;
      }
      setValue("slip", file, { shouldValidate: true });
      const url = URL.createObjectURL(file);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    },
    [setValue]
  );

  // UI drag-n-drop
  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  }, []);

  // drop ไฟล์ลงกล่อง
  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ปุ่มเลือกไฟล์ (คีย์บอร์ด/คลิก)
  const handleChooseFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };
  const onDropzoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // เรียก OCR จากไฟล์ที่เลือก → set amount/date/time ให้ฟอร์ม
  const runOCR = async () => {
    const file = watch("slip") as File | undefined;
    if (!file) {
      setError("slip", { message: "โปรดอัปโหลดรูปก่อนอ่าน OCR" });
      return;
    }

    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr/parse", { method: "POST", body: fd });

      const json = (await res.json().catch(() => null)) as OCRResp | null;
      if (!res.ok || !json || !json.ok) {
        const msg =
          (json && "error" in json && json.error?.message) || "OCR ไม่สำเร็จ";
        throw new Error(msg);
      }

      const { amount: amt, date, time } = json.data ?? {};
      if (amt !== undefined) {
        // รับทั้ง number/string แล้ว normalize เป็น string เพื่อฟอร์ม
        setValue("amount", String(amt), { shouldValidate: true });
      }
      if (date) {
        setValue("date", new Date(date) as UploadImageInput["date"], {
          shouldValidate: true,
        });
      }
      if (time) {
        setValue("time", time as UploadImageInput["time"], {
          shouldValidate: true,
        });
      }

      toast.success("อ่านข้อมูลจากสลิปสำเร็จ");
    } catch (err: unknown) {
      toast.error("อ่านสลิปไม่สำเร็จ", {
        description: getErrorMessage(err, "เกิดข้อผิดพลาดขณะอ่านสลิป"),
      });
    } finally {
      setOcrLoading(false);
    }
  };

  /* -------------------- Add / Delete Category -------------------- */
  // เพิ่มหมวดใหม่ (ผูกกับ type ปัจจุบัน)
  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/tags/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: name, type }),
      });
      const json = (await res
        .json()
        .catch(() => null)) as ApiResp<unknown> | null;
      if (!res.ok || !json || !json.ok) {
        const msg =
          (json && "error" in json && json.error?.message) ||
          "เพิ่มหมวดหมู่ไม่สำเร็จ";
        throw new Error(msg);
      }
      toast.success("เพิ่มหมวดหมู่สำเร็จ");
      setNewCategoryName("");
      setIsAddingCategory(false);
      await mutate(); // รีโหลดรายการ tags
    } catch (err: unknown) {
      toast.error("เพิ่มหมวดหมู่ไม่สำเร็จ", {
        description: getErrorMessage(err, "เกิดข้อผิดพลาด"),
      });
    }
  };

  // ลบหมวดที่เลือก (กันลบ default) และบังคับย้ายธุรกรรมเดิมไปหมวด default ฝั่ง server
  const deleteCategory = async () => {
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
      const json = (await res
        .json()
        .catch(() => null)) as ApiResp<unknown> | null;
      if (!res.ok || !json || !json.ok) {
        const msg =
          (json && "error" in json && json.error?.message) ||
          "ลบหมวดหมู่ไม่สำเร็จ";
        throw new Error(msg);
      }

      toast.success("ลบหมวดหมู่สำเร็จ");
      await mutate(); // รีโหลด tags
      setValue("tag_id", "" as unknown as UploadImageInput["tag_id"], {
        shouldValidate: true,
      }); // บังคับเลือกใหม่
    } catch (err: unknown) {
      toast.error("ลบหมวดหมู่ไม่สำเร็จ", {
        description: getErrorMessage(err, "เกิดข้อผิดพลาด"),
      });
    } finally {
      setDeleting(false);
    }
  };

  /* -------------------- Submit -------------------- */
  // ส่งข้อมูลไปสร้างธุรกรรมใหม่ (ฝั่ง server จะ map tag_id -> type/ชื่อหมวดเอง)
  const onSubmit: SubmitHandler<UploadImageInput> = async (raw) => {
    // parse ด้วย zod อีกรอบ เพื่อให้มั่นใจเรื่อง coercion/validation
    const values = formSchema.parse(raw) as UploadImageOutput;

    try {
      const payload = {
        tag_id: values.tag_id,
        value: values.amount,
        date: format(values.date, "yyyy-MM-dd"),
        time: values.time,
        note: values.note ?? "",
      };

      const res = await fetch("/api/transactions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res
        .json()
        .catch(() => null)) as ApiResp<unknown> | null;
      if (!res.ok || !json || !json.ok) {
        const msg =
          (json && "error" in json && json.error?.message) ||
          "บันทึกรายการไม่สำเร็จ";
        throw new Error(msg);
      }

      toast.success("บันทึกรายการสำเร็จ");

      // กระจาย event ส่วนกลางให้ SWR hooks ที่ฟังอยู่ (transactions) รีโหลด cache
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<{ reason: string }>("mp:transactions:changed", {
            detail: { reason: "upload" },
          })
        );
      }
      onSuccess?.(); // ให้ parent ปิด dialog/refresh server components

      // reset ฟอร์มกลับค่าเริ่มต้น (type คงตามเดิมเพื่อความสะดวก)
      reset({
        type: values.type as UploadImageInput["type"],
        amount: "",
        tag_id: "" as unknown as UploadImageInput["tag_id"],
        note: "",
        date: new Date() as UploadImageInput["date"],
        time: "12:00",
      });

      // ล้าง preview objectURL
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err: unknown) {
      toast.error("อัปโหลดไม่สำเร็จ", {
        description: getErrorMessage(err, "เกิดข้อผิดพลาด"),
      });
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Slip + OCR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slip">สลิป (ไม่บังคับ)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runOCR}
                disabled={ocrLoading || !preview}
              >
                {ocrLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    กำลังอ่าน...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    อ่านจากสลิป (OCR)
                  </>
                )}
              </Button>
            </div>

            {/* Dropzone + Preview รูป */}
            <div
              className={cn(
                "relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/40",
                errors.slip && "border-destructive"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={onDropzoneKeyDown}
              role="button"
              tabIndex={0}
              aria-label="อัปโหลดสลิป"
            >
              {preview ? (
                <div className="relative">
                  <div className="relative mx-auto aspect-[16/9] max-h-64 w-full overflow-hidden rounded-md">
                    <Image
                      src={preview}
                      alt="Preview slip"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  </div>
                  {/* ปุ่มลบรูป/ล้าง preview */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                    aria-label="ลบรูปสลิป"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    ลากและวางหรือคลิกเพื่ออัปโหลด
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG • สูงสุด {MAX_FILE_SIZE_MB}MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleChooseFile}
                  >
                    เลือกไฟล์
                  </Button>
                </div>
              )}
              {/* input file จริง (ซ่อนไว้) */}
              <Input
                ref={fileInputRef}
                id="slip"
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
            </div>
            {errors.slip && (
              <p className="text-sm text-destructive">
                {errors.slip.message as string}
              </p>
            )}
          </div>

          {/* Type & Amount */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>ประเภท *</Label>
              {/* ใช้ Controller เพื่อ bind กับ shadcn/ui Select */}
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                <p className="text-sm text-destructive">
                  {errors.type.message as string}
                </p>
              )}
            </div>

            <div>
              <Label>จำนวนเงิน (THB) *</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <Input {...field} inputMode="decimal" placeholder="0.00" />
                )}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message as string}
                </p>
              )}
              {/* แสดงจำนวนเงินแบบฟอร์แมตเมื่อมีค่า */}
              {amount !== "" && amount !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat("th-TH", {
                    style: "currency",
                    currency: "THB",
                  }).format(
                    Number(
                      typeof amount === "string"
                        ? amount.replace(/,/g, "")
                        : amount
                    )
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>หมวดหมู่ *</Label>
              <div className="flex items-center gap-2">
                {/* เปิดอินพุตเพิ่มหมวดใหม่ */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingCategory(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> เพิ่มหมวดหมู่
                </Button>
                {/* ปุ่มลบหมวด (แสดงเมื่อมีการเลือก) */}
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

            {/* โหมดเพิ่มหมวดใหม่ */}
            {isAddingCategory ? (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ชื่อหมวดหมู่ใหม่"
                />
                <Button
                  onClick={addCategory}
                  disabled={!newCategoryName.trim()}
                >
                  เพิ่ม
                </Button>
                <Button
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
              // เลือกหมวดจากรายการตามประเภท
              <Controller
                control={control}
                name="tag_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) =>
                      field.onChange(val as UploadImageInput["tag_id"])
                    }
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
                    <SelectContent>
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
              <p className="text-sm text-destructive">
                {errors.tag_id.message as string}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">รายละเอียด</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="note"
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  rows={3}
                  className="resize-none"
                />
              )}
            />
            {errors.note && (
              <p className="text-sm text-destructive">
                {errors.note.message as string}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Date picker */}
            <div className="space-y-2">
              <Label>วันที่ *</Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => {
                  const dateVal = toDate(field.value);
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateVal && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateVal ? (
                            format(dateVal, "dd MMMM yyyy", { locale: th })
                          ) : (
                            <span>เลือกวันที่</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateVal}
                          onSelect={(d) =>
                            field.onChange(
                              (d ?? undefined) as UploadImageInput["date"]
                            )
                          }
                          initialFocus
                          locale={th}
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message as string}
                </p>
              )}
            </div>

            {/* Time input */}
            <div className="space-y-2">
              <Label htmlFor="time">เวลา (HH:MM) *</Label>
              <Controller
                control={control}
                name="time"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="time"
                    type="time"
                    step={60}
                    placeholder="12:00"
                  />
                )}
              />
              {errors.time && (
                <p className="text-sm text-destructive">
                  {errors.time.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !isValid}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกรายการ"
              )}
            </Button>

            {/* รีเซ็ตฟอร์ม (เก็บ type เดิมไว้ให้) + ล้าง preview */}
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                const t = watch("type");
                reset({
                  type: t as UploadImageInput["type"],
                  amount: "",
                  tag_id: "" as unknown as UploadImageInput["tag_id"],
                  note: "",
                  date: new Date() as UploadImageInput["date"],
                  time: "12:00",
                });
                setPreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
              }}
              disabled={isSubmitting}
              size="lg"
            >
              ล้างข้อมูล
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
