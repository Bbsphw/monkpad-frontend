// src/app/(auth)/sign-up/signUp-client.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, EyeOff, UserPlus } from "lucide-react";

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

/**
 * ✅ Schema — ตรวจสอบข้อมูลสมัครสมาชิก
 * ----------------------------------------
 * - username: ยาว ≥3 ตัว
 * - email: รูปแบบอีเมล
 * - password: ยาว ≥8 ตัว
 * - confirmPassword: ต้องตรงกับ password
 */
const signUpSchema = z
  .object({
    username: z.string().min(3, "ต้องมีอย่างน้อย 3 ตัวอักษร"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z.string().min(8, "อย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านไม่ตรงกัน",
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * ✅ Client Component — ฟอร์มสมัครสมาชิก
 * ----------------------------------------
 * - ใช้ zod + react-hook-form เพื่อ validate
 * - มี UX แสดง strength ของรหัสผ่านแบบเรียลไทม์
 */
export default function SignUpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // หลังสมัครเสร็จ → redirect ไปหน้า sign-in (หรือ next param ถ้ามี)
  const nextParam = searchParams.get("next");
  const next =
    typeof nextParam === "string" && nextParam.startsWith("/")
      ? nextParam
      : "/sign-in";

  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // ตรวจความแข็งแรงของรหัสผ่านแบบเรียลไทม์
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const pwdChecks = useMemo(
    () => ({
      lengthOk: (password ?? "").length >= 8,
      lowerOk: /[a-z]/.test(password ?? ""),
      upperOk: /[A-Z]/.test(password ?? ""),
      numberOk: /\d/.test(password ?? ""),
    }),
    [password]
  );

  const allPwdOk =
    pwdChecks.lengthOk &&
    pwdChecks.lowerOk &&
    pwdChecks.upperOk &&
    pwdChecks.numberOk;
  const confirmOk = confirmPassword.length > 0 && password === confirmPassword;

  // แสดง check-list เงื่อนไขรหัสผ่าน
  const Hint = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className="flex items-start gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{text}</span>
    </div>
  );

  /**
   * ✅ Submit
   * ----------
   * - POST /api/auth/sign-up
   * - ตรวจ error เฉพาะ username/email ซ้ำ
   */
  const onSubmit: SubmitHandler<SignUpFormData> = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const msg = json?.error?.message || "สมัครสมาชิกไม่สำเร็จ";
        // ตรวจข้อความที่มาจาก backend เพื่อแปลเป็น message ไทย
        if (/Username already registered/i.test(msg)) {
          setError("username", { message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
        } else if (/Email already registered/i.test(msg)) {
          setError("email", { message: "อีเมลนี้ถูกใช้แล้ว" });
        }
        toast.error("สมัครสมาชิกไม่สำเร็จ", { description: msg });
        return;
      }

      toast.success("สมัครสมาชิกสำเร็จ", {
        description: "โปรดเข้าสู่ระบบเพื่อเริ่มใช้งาน",
      });
      router.replace(next);
    } catch (err: any) {
      toast.error("สมัครสมาชิกไม่สำเร็จ", {
        description: err?.message ?? "เกิดข้อผิดพลาด",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ✅ UI ส่วนฟอร์มสมัครสมาชิก */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-2">
          {/* โลโก้ไอคอน */}
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">สมัครสมาชิก</CardTitle>
          <CardDescription>สร้างบัญชีของคุณเพื่อเริ่มใช้งาน</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* USERNAME */}
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                placeholder="เช่น user123"
                autoComplete="username"
                {...register("username")}
                aria-invalid={!!errors.username}
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                autoComplete="email"
                {...register("email")}
                aria-invalid={!!errors.email}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password")}
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
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPwd}
                >
                  {showPwd ? (
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

              {/* เงื่อนไขรหัสผ่าน */}
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <Hint ok={pwdChecks.lengthOk} text="อย่างน้อย 8 ตัวอักษร" />
                <Hint ok={pwdChecks.upperOk} text="มีตัวอักษรพิมพ์ใหญ่ (A-Z)" />
                <Hint ok={pwdChecks.lowerOk} text="มีตัวอักษรพิมพ์เล็ก (a-z)" />
                <Hint ok={pwdChecks.numberOk} text="มีตัวเลข (0-9)" />
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPwd2 ? "text" : "password"}
                  placeholder="พิมพ์รหัสผ่านเดิมอีกครั้ง"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                  className={
                    (errors.confirmPassword ? "border-destructive " : "") +
                    "pr-10"
                  }
                />
                {/* toggle visibility */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPwd2((v) => !v)}
                  aria-label={showPwd2 ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPwd2}
                >
                  {showPwd2 ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              className="w-full gradient-primary"
              disabled={submitting || !allPwdOk || !confirmOk}
            >
              {submitting ? (
                <Loading size="sm" text="กำลังสมัคร..." />
              ) : (
                "สมัครสมาชิก"
              )}
            </Button>

            {/* LINK to sign-in */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">มีบัญชีแล้ว? </span>
              <Link
                href="/sign-in"
                className="text-primary hover:text-primary-hover font-medium"
                prefetch={false}
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
