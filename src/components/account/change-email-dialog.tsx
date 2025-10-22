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
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangeEmailForm>({
    resolver: zodResolver(changeEmailSchema),
    mode: "onTouched",
  });

  const onSubmit = async (values: ChangeEmailForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error("เปลี่ยนอีเมลไม่สำเร็จ", {
          description: json?.error?.message || "โปรดลองอีกครั้ง",
        });
        return;
      }
      toast.success("เปลี่ยนอีเมลสำเร็จ");
      reset();
      setOpen(false);
      // แจ้งและรีเฟรช layout → avatar/ชื่อที่ Sidebar อัปเดตทันที
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:profile:changed", {
            detail: { field: "email" },
          })
        );
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เปลี่ยนอีเมล</DialogTitle>
          <DialogDescription>
            กรอกอีเมลใหม่และยืนยันด้วยรหัสผ่าน
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">อีเมลใหม่</Label>
            <Input id="newEmail" type="email" {...register("newEmail")} />
            {errors.newEmail && (
              <p className="text-sm text-destructive">
                {errors.newEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

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
