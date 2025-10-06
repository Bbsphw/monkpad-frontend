// components/upload/UploadSlipDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UploadImage from "./UploadImage";

interface UploadSlipDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function UploadSlipDialog({
  open,
  onOpenChange,
  onSuccess,
  children,
}: UploadSlipDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange : setInternalOpen;

  const handleSuccess = React.useCallback(() => {
    setCurrentOpen?.(false);
    onSuccess?.();
  }, [setCurrentOpen, onSuccess]);

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
