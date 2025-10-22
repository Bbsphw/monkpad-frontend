// src/components/account/change-password-dialog.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  changePasswordSchema,
  type ChangePasswordForm,
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

export function ChangePasswordDialog({
  asChild,
  trigger,
}: {
  asChild?: boolean; // ให้ Trigger ฝัง className/prop ของตัวเอง (Radix asChild)
  trigger: React.ReactNode; // ปุ่ม/ลิงก์เปิด Dialog ที่ส่งมาจากภายนอก
}) {
  // คุมสถานะเปิด/ปิด Dialog แบบ controlled (จำเป็นเมื่อ trigger ถูกส่งมาจากภายนอก)
  const [open, setOpen] = useState(false);
  // ล็อก UI ระหว่างส่งฟอร์ม ป้องกัน double-submit
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // ผูก react-hook-form กับ zod เพื่อให้ type-safe + validation ง่าย
  // - mode: onTouched → แสดง error เมื่อโฟกัส/blur ฟิลด์
  // - ChangePasswordForm ได้มาจาก schema (กันพลาดเรื่องชนิด)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
  });

  // Handler หลักของการส่งฟอร์ม
  // แนวทาง: ตรวจทั้ง res.ok และ payload.ok เพื่อให้ robust กับรูปแบบ API
  // สำเร็จ → toast + reset ฟอร์ม + ปิด dialog + แจ้ง global event + refresh layout
  const onSubmit = async (values: ChangePasswordForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // ส่งเฉพาะ field ที่ backend ต้องใช้ (ลด surface area)
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        // แสดงรายละเอียดจาก backend ถ้ามี เพื่อช่วยผู้ใช้แก้ไข
        toast.error("เปลี่ยนรหัสผ่านไม่สำเร็จ", {
          description: json?.error?.message || "โปรดลองอีกครั้ง",
        });
        return;
      }

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      // ล้างค่าฟอร์มทันที ลดความเสี่ยงจากการค้างข้อมูลสำคัญใน state
      reset();
      // ปิด dialog เพื่อให้ feedback ชัดเจน
      setOpen(false);

      // Broadcast event ให้ส่วนอื่น ๆ (เช่น โปรไฟล์/เมนู) sync ได้หากจำเป็น
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:profile:changed", {
            detail: { field: "password" },
          })
        );
      }

      // รีเฟรช server components ที่พึ่งพา session/โปรไฟล์ (Next App Router)
      router.refresh();
    } finally {
      // ปลดล็อกปุ่มไม่ว่าจะ success/error
      setSubmitting(false);
    }
  };

  return (
    // ใช้ Dialog แบบ controlled: open + onOpenChange
    <Dialog open={open} onOpenChange={setOpen}>
      {/* รองรับ trigger ภายนอก โดยคง element/props เดิมไว้ผ่าน asChild */}
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>

      <DialogContent>
        {/* ส่วนหัว: ช่วย A11y ด้วย Title/Description ที่ชัดเจน */}
        <DialogHeader>
          <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
          <DialogDescription>กรอกรหัสผ่านเดิมและรหัสผ่านใหม่</DialogDescription>
        </DialogHeader>

        {/* ฟอร์ม: handleSubmit รวม validation + submit */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            {/* เชื่อม Label ↔ Input ผ่าน htmlFor/id เพื่อ screen reader */}
            <Label htmlFor="currentPassword">รหัสผ่านเดิม</Label>
            <Input
              id="currentPassword"
              type="password" // ไม่เปิดเผยอักขระ (พื้นฐานความปลอดภัยฝั่ง UI)
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">ยืนยันรหัสผ่านใหม่</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              {...register("confirmNewPassword")}
            />
            {errors.confirmNewPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>

          {/* ปุ่มกดส่ง: วางใน DialogFooter เพื่อเว้นระยะตาม design system */}
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
