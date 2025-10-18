// src/components/auth/forgot-password-dialog.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordForm,
  type ResetPasswordForm,
} from "@/lib/validators";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const COOLDOWN_SEC = 60;
const OTP_TTL_MINUTES = 10; // แสดงข้อมูลให้ผู้ใช้ทราบ

export function ForgotPasswordDialog({
  asChild,
  trigger,
  presetEmail,
}: {
  asChild?: boolean;
  trigger: React.ReactNode;
  presetEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState(presetEmail ?? "");
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 1: request
  const {
    register: registerReq,
    handleSubmit: handleSubmitReq,
    formState: { errors: errorsReq },
    setValue: setReqValue,
    reset: resetReq,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: presetEmail ?? "" },
  });

  // Step 2: verify/reset
  const {
    register: registerVer,
    handleSubmit: handleSubmitVer,
    formState: { errors: errorsVer },
    setValue: setVerValue,
    reset: resetVer,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email: presetEmail ?? "",
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    setReqValue("email", presetEmail ?? "");
    setVerValue("email", presetEmail ?? "");
    setEmail(presetEmail ?? "");
  }, [presetEmail, setReqValue, setVerValue]);

  // cooldown
  useEffect(() => {
    if (cooldown <= 0 && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [cooldown]);

  const startCooldown = (sec: number) => {
    setCooldown(sec);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((v) => {
        if (v <= 1) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  };

  const canResend = cooldown === 0;

  // Step 1: ส่งอีเมล OTP
  const onRequestOTP = async (values: ForgotPasswordForm) => {
    const e = values.email.trim().toLowerCase();
    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        toast.error("ส่งรหัสไม่สำเร็จ", {
          description:
            json?.error?.message || "ไม่สามารถส่งรหัสได้ โปรดลองใหม่อีกครั้ง",
        });
        return;
      }

      setEmail(e);
      setReqValue("email", e);
      setVerValue("email", e);
      toast.success("ส่งรหัสยืนยันแล้ว", {
        description: `รหัสหมดอายุใน ${OTP_TTL_MINUTES} นาที`,
      });
      setStep("verify");
      startCooldown(COOLDOWN_SEC);
    } catch (err: any) {
      toast.error("ส่งรหัสไม่สำเร็จ", { description: err?.message });
    }
  };

  // Step 2: ยืนยันโค้ด + ตั้งรหัสใหม่
  const onVerifyReset = async (values: ResetPasswordForm) => {
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        toast.error("ยืนยันรหัสไม่สำเร็จ", {
          description: json?.error?.message || "กรุณาตรวจสอบโค้ดอีกครั้ง",
        });
        return;
      }

      toast.success("ตั้งรหัสผ่านใหม่สำเร็จ", {
        description: "โปรดเข้าสู่ระบบด้วยรหัสใหม่ของคุณ",
      });
      // เคลียร์ฟอร์มและปิด dialog
      resetReq();
      resetVer();
      setStep("request");
      setOpen(false);
    } catch (err: any) {
      toast.error("ยืนยันรหัสไม่สำเร็จ", { description: err?.message });
    }
  };

  const title = useMemo(
    () => (step === "request" ? "ลืมรหัสผ่าน" : "ยืนยันรหัส & ตั้งรหัสใหม่"),
    [step]
  );
  const description = useMemo(
    () =>
      step === "request"
        ? "กรอกอีเมล เราจะส่งรหัส 6 หลักให้คุณ (หมดอายุใน 10 นาที)"
        : `เราได้ส่งรหัส 6 หลักไปที่ ${email}`,
    [step, email]
  );

  const resend = async () => {
    if (!canResend) return;
    const e = email.trim().toLowerCase();
    if (!e) return;
    await onRequestOTP({ email: e });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          // reset state
          setStep("request");
          setCooldown(0);
          if (timer.current) clearInterval(timer.current);
        }
      }}
    >
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === "request" ? (
          <form onSubmit={handleSubmitReq(onRequestOTP)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-email">อีเมล</Label>
              <Input id="fp-email" type="email" {...registerReq("email")} />
              {errorsReq.email && (
                <p className="text-sm text-destructive">
                  {errorsReq.email.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">
                ส่งรหัสยืนยัน
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmitVer(onVerifyReset)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rv-email">อีเมล</Label>
              <Input
                id="rv-email"
                type="email"
                disabled
                {...registerVer("email")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rv-code">รหัสยืนยัน (6 หลัก)</Label>
              <Input
                id="rv-code"
                maxLength={6}
                inputMode="numeric"
                {...registerVer("code")}
              />
              {errorsVer.code && (
                <p className="text-sm text-destructive">
                  {errorsVer.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rv-new">รหัสผ่านใหม่</Label>
              <Input
                id="rv-new"
                type="password"
                {...registerVer("newPassword")}
              />
              {errorsVer.newPassword && (
                <p className="text-sm text-destructive">
                  {errorsVer.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rv-confirm">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="rv-confirm"
                type="password"
                {...registerVer("confirmNewPassword")}
              />
              {errorsVer.confirmNewPassword && (
                <p className="text-sm text-destructive">
                  {errorsVer.confirmNewPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={resend}
                disabled={!canResend}
              >
                ส่งรหัสอีกครั้ง{!canResend ? ` (${cooldown}s)` : ""}
              </Button>
              <div className="text-xs text-muted-foreground">
                รหัสหมดอายุใน {OTP_TTL_MINUTES} นาที
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">
                ตั้งรหัสผ่านใหม่
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
