"use client";

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}
