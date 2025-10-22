// components/upload/UploadSlipDialog.tsx

"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UploadImage from "./UploadImage";

type UploadSlipDialogProps = {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onSuccess?: () => void;
  /** ปิด dialog อัตโนมัติหลังสำเร็จ (default: true) */
  closeOnSuccess?: boolean;
  /** ปรับหัวข้อ/คำอธิบายได้ */
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function UploadSlipDialog({
  open,
  onOpenChange,
  onSuccess,
  closeOnSuccess = true,
  title = "เพิ่มรายการธุรกรรม",
  description,
  children,
}: UploadSlipDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : uncontrolledOpen;
  const setOpen = React.useCallback(
    (o: boolean) => (isControlled ? onOpenChange?.(o) : setUncontrolledOpen(o)),
    [isControlled, onOpenChange]
  );

  const router = useRouter();

  const handleSuccess = React.useCallback(() => {
    // ✅ แจ้งทุกหน้า client (SWR) ว่ามีการเปลี่ยนธุรกรรม
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mp:transactions:changed", {
          detail: { reason: "upload" },
        })
      );
    }

    // ✅ รีเฟรชฝั่ง App Router (server components)
    router.refresh();

    if (closeOnSuccess) setOpen(false);
    onSuccess?.();
  }, [router, setOpen, closeOnSuccess, onSuccess]);

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </DialogHeader>

        <div className="mt-4">
          <UploadImage onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
