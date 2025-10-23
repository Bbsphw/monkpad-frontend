// src/components/account/change-email-dialog.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changeEmailSchema, type ChangeEmailForm } from "@/lib/validators";
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

export function ChangeEmailDialog({
  asChild,
  trigger,
}: {
  asChild?: boolean;
  trigger: React.ReactNode;
}) {
  // สถานะเปิด/ปิด dialog และสถานะกำลัง submit (lock UI ป้องกันคลิกซ้ำ)
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // ใช้ react-hook-form + zod เพื่อ validate ฝั่ง client
  // - mode: onTouched → แสดง error เมื่อ field ถูกโฟกัส/blur
  // - type ความปลอดภัย: ChangeEmailForm ถูก derive จาก schema ต้นทาง
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangeEmailForm>({
    resolver: zodResolver(changeEmailSchema),
    mode: "onTouched",
  });

  // handler หลัก: เรียก API เปลี่ยนอีเมล
  // - ปิดการแก้ไขระหว่างส่ง (submitting)
  // - แสดง toast ทั้ง success/error
  // - reset ฟอร์ม + ปิด dialog เมื่อสำเร็จ
  // - ยิง customEvent แจ้งทั้งแอปว่าข้อมูลโปรไฟล์ถูกเปลี่ยน (decouple)
  // - router.refresh() เพื่อให้ server component/layout อัปเดตทันที (เช่น Sidebar)
  const onSubmit = async (values: ChangeEmailForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);

      // แนวปฏิบัติ: ตรวจทั้ง res.ok และ shape { ok: true } ของ payload
      if (!res.ok || !json?.ok) {
        toast.error("เปลี่ยนอีเมลไม่สำเร็จ", {
          description: json?.error?.message || "โปรดลองอีกครั้ง",
        });
        return;
      }

      toast.success("เปลี่ยนอีเมลสำเร็จ");
      // เคลียร์ค่าเดิม — ลดโอกาสกดส่งซ้ำด้วยข้อมูลเดิม
      reset();
      // ปิด dialog เพื่อ feedback ทันทีว่าดำเนินการเรียบร้อย
      setOpen(false);

      // แจ้ง component อื่น ๆ (เช่น avatar/email ที่ cache ไว้ฝั่ง client)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:profile:changed", {
            detail: { field: "email" },
          })
        );
      }

      // รีเฟรชฝั่ง server component ให้ดึงข้อมูลล่าสุด (Next App Router)
      router.refresh();
    } finally {
      // ปลดล็อกปุ่มไม่ว่าจะสำเร็จ/ล้มเหลว
      setSubmitting(false);
    }
  };

  return (
    // ควบคุม open state เอง (controlled) → ซิงก์กับปุ่ม trigger ภายนอก
    <Dialog open={open} onOpenChange={setOpen}>
      {/* asChild: อนุญาตให้ส่งปุ่ม/ลิงก์จากภายนอกมาเป็น trigger โดยคง className/prop ของตัวมันเอง */}
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>

      <DialogContent>
        {/* A11y: Header + Title + Description → screen reader เข้าใจ context */}
        <DialogHeader>
          <DialogTitle>เปลี่ยนอีเมล</DialogTitle>
          <DialogDescription>
            กรอกอีเมลใหม่และยืนยันด้วยรหัสผ่าน
          </DialogDescription>
        </DialogHeader>

        {/* ฟอร์มหลัก: ใช้ handleSubmit ครอบ onSubmit เพื่อรวม validate + submit */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email ใหม่ */}
          <div className="space-y-2">
            {/* Label เชื่อมกับ input ผ่าน htmlFor + id เพื่อ A11y */}
            <Label htmlFor="newEmail">อีเมลใหม่</Label>
            <Input id="newEmail" type="email" {...register("newEmail")} />
            {/* แสดงข้อความ error แบบ inline ใต้ช่อง */}
            {errors.newEmail && (
              <p className="text-sm text-destructive">
                {errors.newEmail.message}
              </p>
            )}
          </div>

          {/* Password ยืนยัน */}
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Footer ปุ่ม: วางใน DialogFooter เพื่อเว้นระยะมาตรฐานของ dialog */}
          <DialogFooter>
            {/* ปุ่มส่ง: disabled ระหว่างกำลังส่ง ป้องกัน double-submit */}
            <Button type="submit" disabled={submitting} className="w-full">
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
