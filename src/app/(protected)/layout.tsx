// src/app/(protected)/layout.tsx
import { ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
