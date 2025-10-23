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

/* ───────────────────────────── UX Constants ─────────────────────────────
 * - COOLDOWN_SEC: กัน spam การกดส่งรหัสซ้ำ
 * - OTP_TTL_MINUTES: แสดง TTL ให้ผู้ใช้ทราบ (สื่อสารอย่างโปร่งใส)
 */
const COOLDOWN_SEC = 60;
const OTP_TTL_MINUTES = 10;

/* ───────────────────────────── Error Utils ─────────────────────────────
 * ดึง error message จาก unknown โดยไม่ใช้ `any`
 */
function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "เกิดข้อผิดพลาด";
}

export function ForgotPasswordDialog({
  asChild,
  trigger,
  presetEmail,
}: {
  asChild?: boolean;
  trigger: React.ReactNode;
  /** อีเมลตั้งต้นที่ดึงมาจากฟอร์ม sign-in (ถ้ารูปแบบถูกต้อง) เพื่อเติมให้ผู้ใช้ */
  presetEmail?: string;
}) {
  /** คุม state ของ Dialog และ flow 2 ขั้นตอน */
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState(presetEmail ?? "");
  const [cooldown, setCooldown] = useState(0);

  /** เก็บ interval id ไว้ clear เองเมื่อ dialog ปิด/ครบเวลา (เลี่ยง memory leak) */
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ───────────────── Step 1: request form ─────────────────
   * แยก useForm ต่อ step ชัดเจน → type-safe + isolate validation
   */
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

  /* ───────────────── Step 2: verify/reset form ─────────────────
   * แยก state ของฟอร์ม verify ออกจาก request เพื่อไม่ให้ field/dirty state รบกวนกัน
   */
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

  /** เมื่อ presetEmail เปลี่ยน → sync ค่าให้ทั้งสองฟอร์ม + state กลาง (email) */
  useEffect(() => {
    const e = presetEmail ?? "";
    setReqValue("email", e);
    setVerValue("email", e);
    setEmail(e);
  }, [presetEmail, setReqValue, setVerValue]);

  /** ดูแลอายุของ interval ด้วย state cooldown */
  useEffect(() => {
    if (cooldown <= 0 && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [cooldown]);

  /** เริ่มนับ cooldown ใหม่ทุกครั้งที่ส่งรหัส
   * - ใช้ setInterval + setState แบบ functional เพื่อความถูกต้องของค่าล่าสุด
   * - เก็บ/ล้าง interval ใน ref ป้องกันการสร้างซ้อน/ลืม clear
   */
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

  /** ปุ่มส่งรหัสซ้ำจะกดได้เฉพาะเมื่อ cooldown หมด */
  const canResend = cooldown === 0;

  /* ───────────────── Handlers ───────────────── */

  /** Step 1: ส่งอีเมล OTP
   * - normalize อีเมลให้เป็น lower-case
   * - สื่อสารผลลัพธ์ผ่าน toast
   * - เปลี่ยน step → verify และเริ่ม cooldown
   */
  const onRequestOTP = async (values: ForgotPasswordForm) => {
    const e = values.email.trim().toLowerCase();
    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const json: unknown = await res.json().catch(() => null);

      const ok =
        res.ok &&
        !!(json && typeof json === "object") &&
        "ok" in json &&
        Boolean((json as { ok?: unknown }).ok);

      if (!ok) {
        const errObj =
          json && typeof json === "object" && "error" in json
            ? (json as { error?: unknown }).error
            : undefined;
        const msg =
          errObj &&
          typeof errObj === "object" &&
          errObj !== null &&
          "message" in errObj
            ? String((errObj as { message?: unknown }).message ?? "")
            : "ไม่สามารถส่งรหัสได้ โปรดลองใหม่อีกครั้ง";
        toast.error("ส่งรหัสไม่สำเร็จ", { description: msg });
        return;
      }

      // sync ค่า email ไปทั้งสองฟอร์ม + state กลาง
      setEmail(e);
      setReqValue("email", e);
      setVerValue("email", e);

      toast.success("ส่งรหัสยืนยันแล้ว", {
        description: `รหัสหมดอายุใน ${OTP_TTL_MINUTES} นาที`,
      });

      setStep("verify");
      startCooldown(COOLDOWN_SEC);
    } catch (err: unknown) {
      toast.error("ส่งรหัสไม่สำเร็จ", { description: getErrorMessage(err) });
    }
  };

  /** Step 2: ยืนยันโค้ด + ตั้งรหัสใหม่
   * - ส่งค่าไป backend ทั้งก้อน (email, code, newPassword, confirmNewPassword)
   * - สำเร็จ: รีเซ็ตทั้งสองฟอร์ม + ปิด dialog + กลับไปหน้า request
   */
  const onVerifyReset = async (values: ResetPasswordForm) => {
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json: unknown = await res.json().catch(() => null);

      const ok =
        res.ok &&
        !!(json && typeof json === "object") &&
        "ok" in json &&
        Boolean((json as { ok?: unknown }).ok);

      if (!ok) {
        const errObj =
          json && typeof json === "object" && "error" in json
            ? (json as { error?: unknown }).error
            : undefined;
        const msg =
          errObj &&
          typeof errObj === "object" &&
          errObj !== null &&
          "message" in errObj
            ? String((errObj as { message?: unknown }).message ?? "")
            : "กรุณาตรวจสอบโค้ดอีกครั้ง";
        toast.error("ยืนยันรหัสไม่สำเร็จ", { description: msg });
        return;
      }

      // เคลียร์สถานะทุกอย่างให้เหมือนเปิด dialog ใหม่
      resetReq();
      resetVer();
      setStep("request");
      setOpen(false);
    } catch (err: unknown) {
      toast.error("ยืนยันรหัสไม่สำเร็จ", { description: getErrorMessage(err) });
    }
  };

  /** ชื่อเรื่อง/คำอธิบายใน Dialog อิงตาม step เพื่อ UX ที่ชัดเจน */
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

  /** ปุ่มส่งรหัสซ้ำ:
   * - เคารพ cooldown
   * - ใช้ email ปัจจุบันที่ยืนยันแล้วใน state
   */
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
          // เมื่อปิด dialog → เคลียร์ state ภายใน + timer ให้เรียบร้อย
          setStep("request");
          setCooldown(0);
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
        }
      }}
    >
      {/* asChild: ให้ parent เป็นตัวกำหนด element จริงของ trigger (ยืดหยุ่นเรื่อง semantics) */}
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          {/* การตั้ง Title/Description ช่วยด้าน A11y ของ Dialog */}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === "request" ? (
          /* ───────── Step 1: ฟอร์มขอรหัส ───────── */
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
          /* ───────── Step 2: ฟอร์มยืนยัน/ตั้งรหัส ───────── */
          <form onSubmit={handleSubmitVer(onVerifyReset)} className="space-y-4">
            {/* email: disable เพื่อกัน user แก้ระหว่างขั้นตอน (source of truth อยู่ใน state) */}
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

            {/* แถบล่าง: ปุ่มส่งรหัสอีกครั้ง + แจ้ง TTL */}
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
