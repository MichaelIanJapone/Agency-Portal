import type { ReactNode } from "react";

import { MobileTopbar } from "@/components/dashboard/mobile-topbar";
import { Sidebar } from "@/components/dashboard/sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100/60 dark:from-zinc-950 dark:to-zinc-900">
      <MobileTopbar />
      <div className="md:flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
