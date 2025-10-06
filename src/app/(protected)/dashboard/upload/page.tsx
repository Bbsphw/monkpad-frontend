// app/(protected)/dashboard/upload/page.tsx

import UploadImage from "@/components/upload/UploadImage";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add e-slip</h1>
      <UploadImage
        onSuccess={() => {
          /* refresh or router.push('/dashboard/transactions') */
        }}
      />
    </div>
  );
}
