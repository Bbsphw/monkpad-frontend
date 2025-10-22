// // src/components/upload/UploadSlipDialog.tsx

// "use client";

// import * as React from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import UploadImage from "./UploadImage";

// interface UploadSlipDialogProps {
//   open?: boolean;
//   onOpenChange?: (open: boolean) => void;
//   onSuccess?: () => void;
//   children: React.ReactNode;
// }

// export function UploadSlipDialog({
//   open,
//   onOpenChange,
//   onSuccess,
//   children,
// }: UploadSlipDialogProps) {
//   const [internalOpen, setInternalOpen] = React.useState(false);
//   const controlled = open !== undefined;
//   const isOpen = controlled ? open : internalOpen;
//   const setOpen = controlled ? onOpenChange : setInternalOpen;

//   const handleSuccess = React.useCallback(() => {
//     setOpen?.(false);
//     onSuccess?.(); // ให้ parent จัดการ reload/refresh ตามต้องการ
//   }, [setOpen, onSuccess]);

//   return (
//     <Dialog open={isOpen} onOpenChange={setOpen}>
//       <DialogTrigger asChild>{children}</DialogTrigger>
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl">เพิ่มรายการธุรกรรม</DialogTitle>
//         </DialogHeader>
//         <div className="mt-4">
//           <UploadImage onSuccess={handleSuccess} />
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

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

export function UploadSlipDialog({
  open,
  onOpenChange,
  onSuccess,
  children,
}: {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onSuccess?: () => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange : setInternalOpen;
  const router = useRouter();

  const handleSuccess = React.useCallback(() => {
    // // แจ้งทุกหน้า client ว่ามีการเปลี่ยนธุรกรรม
    // if (typeof window !== "undefined") {
    //   window.dispatchEvent(
    //     new CustomEvent("mp:transactions:changed", {
    //       detail: { reason: "upload" },
    //     })
    //   );
    // }
    // รีเฟรช data ฝั่ง App Router (SSR parts, เช่น dashboard/transaction/reports)
    router.refresh();
    setCurrentOpen?.(false);
    onSuccess?.();
  }, [router, setCurrentOpen, onSuccess]);

  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">เพิ่มรายการธุรกรรม</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <UploadImage onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
