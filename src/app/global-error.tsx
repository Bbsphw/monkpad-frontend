// app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="min-h-dvh grid place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold">เกิดข้อผิดพลาด</h1>
          <p className="mb-4 text-muted-foreground">{error.message}</p>
          <button
            className="rounded-md bg-foreground px-4 py-2 text-background"
            onClick={() => reset()}
          >
            กลับหน้าแรก
          </button>
        </div>
      </body>
    </html>
  );
}
