// app/global-error.tsx

"use client";

/**
 * GlobalError
 * ------------
 * Component นี้จะถูก Next.js เรียกใช้โดยอัตโนมัติเมื่อเกิด error ที่ระดับ root (app router)
 * เช่น:
 *  - เกิดข้อผิดพลาดใน server component ระหว่าง render
 *  - throw error ที่ไม่ได้ถูกจับภายใน layout หรือ page
 *
 * Design Goals:
 *  - แสดงข้อความที่เข้าใจง่ายต่อผู้ใช้
 *  - ปลอดภัย (ไม่เปิดเผย stack trace)
 *  - รองรับ reset() เพื่อ reload route เดิม (ไม่ต้อง refresh ทั้งหน้า)
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void; // ฟังก์ชัน reset() ที่ Next.js ส่งมาให้ — รีโหลด route ปัจจุบัน
}) {
  return (
    <html lang="th">
      <body className="min-h-dvh grid place-items-center p-6 bg-background text-foreground">
        <div className="max-w-md text-center space-y-4">
          {/* หัวข้อหลัก */}
          <h1 className="text-2xl font-bold">เกิดข้อผิดพลาด</h1>

          {/* ข้อความ error (สั้น ๆ ไม่โชว์ stack) */}
          <p className="text-sm text-muted-foreground break-words">
            {error.message || "ไม่สามารถโหลดหน้านี้ได้ในขณะนี้"}
          </p>

          {/* ปุ่มรีเซ็ต */}
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-foreground px-4 py-2 text-background font-medium hover:opacity-90 transition"
          >
            กลับหน้าเดิม
          </button>

          {/* Optional: debug digest (ใช้เฉพาะ dev mode) */}
          {process.env.NODE_ENV === "development" && error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              <code>Digest: {error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
