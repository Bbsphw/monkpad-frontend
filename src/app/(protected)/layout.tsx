// // src/app/(protected)/layout.tsx
// import { ReactNode } from "react";

// export default async function ProtectedLayout({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   return <>{children}</>;
// }

// DashboardLayout.tsx
// "use client";

import { ReactNode } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeaderDashboard } from "@/components/dashboard/site-header";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeaderDashboard />
        <main className="flex flex-1 flex-col p-4 md:p-6 gap-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
