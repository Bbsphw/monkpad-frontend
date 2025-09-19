"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
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
import { signInSchema, type SignInFormData } from "@/lib/validators";

type Props = {
  redirect?: string; // URL ที่จะไปหลังจากล็อกอินสำเร็จ
};

export default function SignInClient({ redirect }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (data: SignInFormData) => {
    setSubmitting(true);
    const callbackUrl = searchParams.get("redirect") || "/dashboard";

    const res = await signIn("credentials", {
      redirect: false,
      identifier: data.identifier,
      password: data.password,
      callbackUrl,
    });

    setSubmitting(false);

    if (!res || res.error) {
      const msg = res?.error || "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง";
      // ❗ ทำให้ขึ้นแดงทั้งสองช่อง
      setError("identifier", {
        message: "กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมลอีกครั้ง",
      });
      setError("password", { message: "กรุณาตรวจสอบรหัสผ่านอีกครั้ง" });
      toast.error("เข้าสู่ระบบไม่สำเร็จ", { description: msg });
      return;
    }

    toast.success("เข้าสู่ระบบสำเร็จ");
    router.replace(res.url ?? callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="identifier">อีเมลหรือชื่อผู้ใช้</Label>
              <Input
                id="identifier"
                placeholder="user@example.com หรือ username"
                autoComplete="username"
                {...register("identifier")}
                aria-invalid={!!errors.identifier}
                className={errors.identifier ? "border-destructive" : ""}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">ยังไม่มีบัญชี? </span>
            <Link
              href="/sign-up"
              className="text-primary hover:text-primary-hover font-medium"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
