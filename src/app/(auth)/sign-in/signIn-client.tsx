// src/app/(auth)/sign-in/signIn-client.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loading } from "@/components/common/loading";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";

/**
 * ✅ Schema — ใช้ zod ตรวจข้อมูลฝั่ง client ก่อนส่ง API
 * ----------------------------------------------------------
 * - identifier: username หรือ email
 * - password: ต้องกรอก
 * - remember: boolean (optional)
 */
const signInClientSchema = z.object({
  identifier: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  remember: z.boolean().default(false),
});

// React Hook Form จะใช้ "input type" ของ schema
type SignInClientForm = z.input<typeof signInClientSchema>;

/**
 * Helper: ตรวจว่าเป็นรูปแบบ email หรือไม่
 * ใช้เพื่อ prefill dialog ลืมรหัสผ่าน
 */
function isEmailLike(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * ✅ Client Component — ฟอร์มเข้าสู่ระบบ
 * ---------------------------------------
 * - handle UX ทั้งหมด: validation, show/hide password, toast
 * - ใช้ react-hook-form + zodResolver เพื่อความปลอดภัย/ง่ายต่อการตรวจสอบ
 * - ใช้ next/navigation เพื่อ redirect หลังล็อกอิน
 */
export default function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ป้องกัน open redirect attack (ตรวจแค่เส้นทางภายใน)
  const nextParam = searchParams.get("next");
  const next =
    typeof nextParam === "string" && nextParam.startsWith("/")
      ? nextParam
      : "/dashboard";

  // states
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ฟอร์มหลัก
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    control,
    watch,
    formState: { errors },
  } = useForm<SignInClientForm>({
    resolver: zodResolver(signInClientSchema),
    defaultValues: { identifier: "", password: "", remember: false },
    mode: "onTouched",
  });

  // ดึง email สำหรับใช้ใน ForgotPasswordDialog
  const identifier = watch("identifier");
  const presetEmail = useMemo(
    () => (isEmailLike(identifier ?? "") ? identifier.trim() : ""),
    [identifier]
  );

  /**
   * ✅ Handle submit
   * ----------------
   * - POST /api/auth/sign-in
   * - ถ้า ok → toast success + redirect
   * - ถ้า fail → แสดง error บนฟอร์ม + toast error
   */
  const onSubmit: SubmitHandler<SignInClientForm> = async (data) => {
    setSubmitting(true);
    try {
      const remember = !!data.remember;

      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.identifier,
          password: data.password,
          remember,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const msg = json?.error?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
        // ตั้ง error ไปยังช่องที่เกี่ยวข้อง
        setError("identifier", { message: "กรุณาตรวจสอบชื่อผู้ใช้อีกครั้ง" });
        setError("password", { message: "กรุณาตรวจสอบรหัสผ่านอีกครั้ง" });
        toast.error("เข้าสู่ระบบไม่สำเร็จ", { description: msg });
        return;
      }

      toast.success("เข้าสู่ระบบสำเร็จ");
      router.replace(next); // redirect ไปหน้า dashboard
    } catch (err: any) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ", {
        description: err?.message ?? "เกิดข้อผิดพลาด",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ✅ UI ส่วนฟอร์ม */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-2">
          {/* โลโก้ไอคอน */}
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            เข้าสู่ระบบเพื่อจัดการรายรับรายจ่ายของคุณ
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* USERNAME / EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="identifier">ชื่อผู้ใช้</Label>
              <Input
                id="identifier"
                placeholder="username"
                autoComplete="username"
                {...register("identifier")}
                onChange={(e) => {
                  clearErrors("identifier");
                  register("identifier").onChange(e);
                }}
                aria-invalid={!!errors.identifier}
                className={errors.identifier ? "border-destructive" : ""}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  onChange={(e) => {
                    clearErrors("password");
                    register("password").onChange(e);
                  }}
                  aria-invalid={!!errors.password}
                  className={
                    (errors.password ? "border-destructive " : "") + "pr-10"
                  }
                />
                {/* ปุ่ม toggle password */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* REMEMBER & FORGOT */}
            <div className="flex items-center justify-between">
              {/* Checkbox */}
              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 select-none">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-sm">จำฉันไว้ (7 วัน)</span>
                  </label>
                )}
              />
              {/* Forgot Password Dialog */}
              <ForgotPasswordDialog
                asChild
                trigger={
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                }
                presetEmail={presetEmail || undefined}
              />
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              className="w-full gradient-primary"
              disabled={submitting}
            >
              {submitting ? (
                <Loading size="sm" text="กำลังเข้าสู่ระบบ..." />
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>

            {/* REGISTER LINK */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">ยังไม่มีบัญชี? </span>
              <Link
                href="/sign-up"
                className="text-primary hover:text-primary-hover font-medium"
                prefetch={false}
              >
                สมัครสมาชิก
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
