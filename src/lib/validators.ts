import { z } from "zod";

/** Sign In */
export const signInSchema = z.object({
  identifier: z.string().min(4, "กรอกชื่อผู้ใช้หรืออีเมล"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});
export type SignInFormData = z.infer<typeof signInSchema>;

/** Sign Up */
export const signUpSchema = z
  .object({
    username: z.string().min(4, "โปรดกรอกชื่อผู้ใช้อย่างน้อย 4 ตัวอักษร"),
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string().min(8, "โปรดยืนยันรหัสผ่าน"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านไม่ตรงกัน",
  });
export type SignUpFormData = z.infer<typeof signUpSchema>;
