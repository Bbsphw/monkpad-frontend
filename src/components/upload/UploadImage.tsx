// components/upload/UploadImage.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
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
import { CalendarIcon, UploadCloud, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const formSchema = z.object({
  slip: z
    .instanceof(File, { message: "โปรดอัปโหลดรูปสลิป" })
    .refine((file) => ACCEPTED_TYPES.includes(file.type), {
      message: "รองรับเฉพาะ PNG, JPG หรือ WebP",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024, {
      message: `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`,
    }),
  type: z.enum(["income", "expense"], {
    required_error: "กรุณาเลือกประเภท",
  }),
  amount: z
    .string()
    .min(1, "กรุณากรอกจำนวนเงิน")
    .refine(
      (val) =>
        !isNaN(Number(val.replace(/,/g, ""))) &&
        Number(val.replace(/,/g, "")) > 0,
      "จำนวนเงินต้องมากกว่า 0"
    ),
  category: z.string().min(1, "กรุณาเลือกหรือสร้างหมวดหมู่"),
  description: z
    .string()
    .max(500, "รายละเอียดต้องไม่เกิน 500 ตัวอักษร")
    .optional(),
  date: z.date({ required_error: "กรุณาเลือกวันที่" }),
});

export type UploadImageValues = z.infer<typeof formSchema>;

interface UploadImageProps {
  onSuccess?: (payload: {
    slip: File;
    type: "income" | "expense";
    amount: number;
    category: string;
    description?: string;
    date: Date;
  }) => void;
}

export default function UploadImage({ onSuccess }: UploadImageProps) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<UploadImageValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date(),
    },
    mode: "onChange",
  });

  // Load categories
  React.useEffect(() => {
    const savedCategories = localStorage.getItem("user-categories");
    if (savedCategories) {
      try {
        setCustomCategories(JSON.parse(savedCategories));
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
  }, []);

  // Persist categories
  React.useEffect(() => {
    localStorage.setItem("user-categories", JSON.stringify(customCategories));
  }, [customCategories]);

  // Cleanup object URL
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileSelect = React.useCallback(
    (file: File | null) => {
      if (!file) {
        setPreview(null);
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

  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  }, []);

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (name && !customCategories.includes(name)) {
      const updated = [...customCategories, name];
      setCustomCategories(updated);
      setValue("category", name, { shouldValidate: true });
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  };

  const onSubmit = async (values: UploadImageValues) => {
    try {
      const amountNumber = Number(values.amount.replace(/,/g, ""));
      const payload = {
        slip: values.slip,
        type: values.type,
        amount: amountNumber,
        category: values.category,
        description: values.description,
        date: values.date,
      };

      // add new category if needed
      if (!customCategories.includes(values.category)) {
        setCustomCategories((prev) => [...prev, values.category]);
      }

      // simulate API
      await new Promise((r) => setTimeout(r, 1000));

      onSuccess?.(payload);

      // reset (keep categories)
      reset({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date(),
      });
      setPreview(null);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const amount = watch("amount");
  const selectedCategory = watch("category");

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Dropzone */}
          <div className="space-y-2">
            <Label htmlFor="slip">สลิป *</Label>
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      ลากและวางหรือคลิกเพื่ออัปโหลด
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG, WebP • สูงสุด {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    เลือกไฟล์
                  </Button>
                </div>
              )}
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
              <p className="text-sm text-destructive">{errors.slip.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">ประเภท *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" className="w-full">
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
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">จำนวนเงิน (THB) *</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full"
                  />
                )}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
              {amount && (
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat("th-TH", {
                    style: "currency",
                    currency: "THB",
                  }).format(Number(amount.replace(/,/g, "")) || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">หมวดหมู่ *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingCategory(true)}
                className="h-8 px-2 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                สร้างหมวดหมู่ใหม่
              </Button>
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ชื่อหมวดหมู่ใหม่"
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  size="sm"
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
                  size="sm"
                >
                  ยกเลิก
                </Button>
              </div>
            ) : (
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category">
                      <SelectValue
                        placeholder={
                          customCategories.length === 0
                            ? "สร้างหมวดหมู่แรกของคุณ"
                            : "เลือกหมวดหมู่"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {customCategories.length === 0 ? (
                        // ❌ ห้ามสร้าง SelectItem ที่ value=""
                        <div className="p-2 text-sm text-muted-foreground">
                          ยังไม่มีหมวดหมู่ — สร้างหมวดหมู่ใหม่ก่อน
                        </div>
                      ) : (
                        customCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.category && (
              <p className="text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
            {customCategories.length > 0 && selectedCategory && (
              <p className="text-xs text-muted-foreground">
                เลือก: <span className="font-medium">{selectedCategory}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="description"
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  rows={3}
                  className="resize-none"
                />
              )}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>วันที่ *</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "dd MMMM yyyy", { locale: th })
                      ) : (
                        <span>เลือกวันที่</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={th}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
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
                "บันทึกธุรกรรม"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset({
                  type: "expense",
                  amount: "",
                  category: "",
                  description: "",
                  date: new Date(),
                });
                setPreview(null);
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
