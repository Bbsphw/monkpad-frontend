"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { signUpSchema, type SignUpFormData } from "@/lib/validators";
import { registerUserAction } from "./actions";

export default function SignUpClient() {
  const router = useRouter();
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

  const onSubmit: SubmitHandler<SignUpFormData> = async (values) => {
    setSubmitting(true);
    try {
      const result = await registerUserAction(values);

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
            if (msgs?.length)
              setError(field as keyof SignUpFormData, { message: msgs[0] });
          });
        }
        const msg = result.formError || "สมัครสมาชิกไม่สำเร็จ";
        toast.error("สมัครสมาชิกไม่สำเร็จ", { description: msg });
        return;
      }

      toast.success("สมัครสมาชิกสำเร็จ", { description: "โปรดเข้าสู่ระบบ" });
      router.replace("/sign-in");
    } catch (err) {
      toast.error("สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-2">
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
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                placeholder="เช่น user"
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

            {/* Email */}
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

            {/* Password */}
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

              {/* Checklist */}
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <Hint
                  ok={pwdChecks.lengthOk}
                  text="ความยาวอย่างน้อย 8 ตัวอักษร"
                />
                <Hint ok={pwdChecks.upperOk} text="มีตัวอักษรพิมพ์ใหญ่ (A-Z)" />
                <Hint ok={pwdChecks.lowerOk} text="มีตัวอักษรพิมพ์เล็ก (a-z)" />
                <Hint ok={pwdChecks.numberOk} text="มีตัวเลข (0-9)" />
              </div>
            </div>

            {/* Confirm Password */}
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

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">มีบัญชีแล้ว? </span>
              <Link
                href="/sign-in"
                className="text-primary hover:text-primary-hover font-medium"
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
