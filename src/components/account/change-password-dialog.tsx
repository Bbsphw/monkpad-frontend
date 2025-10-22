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
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = async (values: ChangePasswordForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error("เปลี่ยนรหัสผ่านไม่สำเร็จ", {
          description: json?.error?.message || "โปรดลองอีกครั้ง",
        });
        return;
      }
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      reset();
      setOpen(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mp:profile:changed", {
            detail: { field: "password" },
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
          <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
          <DialogDescription>กรอกรหัสผ่านเดิมและรหัสผ่านใหม่</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">รหัสผ่านเดิม</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
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
