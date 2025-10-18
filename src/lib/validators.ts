import { z } from "zod";

// Sign-in: รองรับทั้งอีเมลหรือยูสเซอร์เนมในฟิลด์เดียวชื่อ identifier
export const signInSchema = z.object({
  identifier: z.string().min(1, "กรุณากรอกอีเมลหรือชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});
export type SignInFormData = z.infer<typeof signInSchema>;

// Sign-up + ยืนยันรหัสผ่าน
export const signUpSchema = z
  .object({
    username: z.string().min(3, "ชื่อผู้ใช้ยาวอย่างน้อย 3 ตัว"),
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    password: z
      .string()
      .min(8, "รหัสผ่านยาวอย่างน้อย 8 ตัว")
      .refine((v) => /[a-z]/.test(v), "ต้องมีตัวอักษร a-z")
      .refine((v) => /[A-Z]/.test(v), "ต้องมีตัวอักษร A-Z")
      .refine((v) => /\d/.test(v), "ต้องมีตัวเลข 0-9"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
