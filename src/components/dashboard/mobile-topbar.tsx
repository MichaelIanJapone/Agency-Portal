import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BriefcaseBusiness, Building2, FolderKanban, LayoutDashboard, Menu, Users } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agencies", label: "Agencies", icon: Building2 },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
];

export async function MobileTopbar() {
  const { userId } = await auth();

  return (
    <div className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/90 md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-100 p-1.5">
            <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Agency Portal</p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {userId ? <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} /> : null}
          <details className="relative">
            <summary className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
              <Menu className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <nav className="space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
                {!userId ? (
                  <Link
                    href="/sign-in"
                    className="mt-1 flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Sign in
                  </Link>
                ) : null}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
