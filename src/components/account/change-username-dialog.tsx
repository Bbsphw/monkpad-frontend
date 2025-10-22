// src/components/account/change-username-dialog.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  changeUsernameSchema,
  type ChangeUsernameForm,
} from "@/lib/validators";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function ChangeUsernameDialog({
  asChild,
  trigger,
}: {
  asChild?: boolean; // ให้ Trigger ภายนอกคง element/props เดิม (Radix asChild)
  trigger: React.ReactNode; // ปุ่ม/ลิงก์ที่ใช้เปิด dialog ส่งเข้ามาจากภายนอก
}) {
  // คุมการเปิด/ปิดแบบ controlled → ซิงก์กับ Trigger ภายนอกได้ดี
  const [open, setOpen] = useState(false);
  // flag ล็อกปุ่ม submit ระหว่างยิง API ป้องกัน double-submit
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // ผูก react-hook-form + zod (type-safe + error message จาก schema เดียว)
  const {
    register, // bind input
    handleSubmit, // wrap onSubmit ให้ผ่าน validation ก่อน
    formState: { errors }, // เก็บ validation errors
    reset, // ใช้ล้างค่า form หลังสำเร็จ
  } = useForm<ChangeUsernameForm>({
    resolver: zodResolver(changeUsernameSchema), // ✅ กำหนดกติกาใน schema เดียว
    mode: "onTouched", // แสดง error เมื่อ blur ฟิลด์
  });

  // ส่งฟอร์ม: ตรวจทั้ง res.ok + json.ok เพื่อ robust ต่อรูปแบบ API
  const onSubmit = async (values: ChangeUsernameForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // ส่ง เฉพาะ field ที่จำเป็น ลด surface area
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        // แสดงรายละเอียด error จาก backend ถ้ามี → UX แก้ไขง่ายขึ้น
        toast.error("เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ", {
          description: json?.error?.message || "โปรดลองอีกครั้ง",
        });
        return;
      }

      // ✅ สำเร็จ: แจ้งผู้ใช้ + ล้างฟอร์ม + ปิด dialog
      toast.success("เปลี่ยนชื่อผู้ใช้สำเร็จ");
      reset();
      setOpen(false);

      // Broadcast event ให้ส่วนอื่น ๆ (เช่น Sidebar) อัปเดตชื่อ/Avatar ได้
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:profile:changed", {
            detail: { field: "username" },
          })
        );
      }

      // รีเฟรช server components ที่พึ่งพาโปรไฟล์/เซสชัน
      router.refresh();
    } finally {
      // ปลดล็อกปุ่ม submit เสมอ (ทั้งกรณี success/error)
      setSubmitting(false);
    }
  };

  return (
    // ใช้ Dialog แบบ controlled: open + onOpenChange
    <Dialog open={open} onOpenChange={setOpen}>
      {/* รองรับ trigger ภายนอก โดยไม่บังคับ DOM เพิ่มเติมผ่าน asChild */}
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>

      <DialogContent>
        {/* A11y: ใส่ Title/Description ให้ชัดเพื่อ screen reader */}
        <DialogHeader>
          <DialogTitle>เปลี่ยนชื่อผู้ใช้</DialogTitle>
          <DialogDescription>
            ชื่อต้องยาว 3–24 ตัวอักษร และใช้ได้เฉพาะ a-z0-9 _ . -
          </DialogDescription>
        </DialogHeader>

        {/* ฟอร์ม: ไม่ใช้ action เพื่อควบคุมผ่าน JS/SPA + ป้องกัน reload */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username ใหม่ */}
          <div className="space-y-2">
            {/* เชื่อม Label ↔ Input ด้วย htmlFor/id → ดีต่อ A11y */}
            <Label htmlFor="newUsername">ชื่อผู้ใช้ใหม่</Label>
            <Input id="newUsername" {...register("newUsername")} />
            {/* แสดงข้อความ error จาก zod (ถ้ามี) */}
            {errors.newUsername && (
              <p className="text-sm text-destructive">
                {errors.newUsername.message}
              </p>
            )}
          </div>

          {/* Password ปัจจุบัน: ใช้ยืนยันสิทธิ์ */}
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password" // ปกปิดอักขระฝั่ง UI (พื้นฐานด้านความปลอดภัย)
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* ปุ่มกด: อยู่ใน DialogFooter เพื่อ spacing ตาม design system */}
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
