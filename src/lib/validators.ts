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

// เปลี่ยนรหัสผ่าน
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "รหัสผ่านเดิมอย่างน้อย 8 ตัวอักษร"),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร")
      .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็ก (a-z)")
      .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่ (A-Z)")
      .regex(/\d/, "ต้องมีตัวเลข (0-9)"),
    confirmNewPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "รหัสผ่านใหม่ไม่ตรงกัน",
  });
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// เปลี่ยนอีเมล
export const changeEmailSchema = z.object({
  newEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});
export type ChangeEmailForm = z.infer<typeof changeEmailSchema>;

// เปลี่ยนชื่อผู้ใช้
export const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, "อย่างน้อย 3 ตัวอักษร")
    .max(24, "ไม่เกิน 24 ตัวอักษร")
    .regex(/^[A-Za-z0-9_.-]+$/, "อนุญาตเฉพาะตัวอักษร/ตัวเลข/_ . -"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});
export type ChangeUsernameForm = z.infer<typeof changeUsernameSchema>;

// ลืมรหัสผ่าน
export const forgotPasswordSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
});
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

// รีเซ็ตรหัสผ่าน
export const resetPasswordSchema = z
  .object({
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    code: z.string().min(6, "กรอกรหัส 6 หลัก").max(6, "กรอกรหัส 6 หลัก"),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร")
      .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็ก (a-z)")
      .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่ (A-Z)")
      .regex(/\d/, "ต้องมีตัวเลข (0-9)"),
    confirmNewPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "รหัสผ่านใหม่ไม่ตรงกัน",
  });
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
