import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export default function ErrorAlert({ className, children, ...rest }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
