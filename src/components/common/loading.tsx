"use client";

import { Loader2 } from "lucide-react";

type LoadingSize = "sm" | "md" | "lg";
export interface LoadingProps {
  size?: LoadingSize;
  text?: string;
}
const sizeMap: Record<LoadingSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Loading({ size = "md", text }: LoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizeMap[size]} animate-spin`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}
