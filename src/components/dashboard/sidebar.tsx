import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowUpRight, BriefcaseBusiness, Building2, FolderKanban, LayoutDashboard, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agencies", label: "Agencies", icon: Building2 },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
];

export async function Sidebar() {
  const { userId } = await auth();

  return (
    <aside className="hidden w-full border-b bg-white/80 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:sticky md:top-0 md:block md:h-screen md:w-72 md:overflow-y-auto md:border-b-0 md:border-r md:px-5">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <BriefcaseBusiness className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">Agency Portal</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Client workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {userId ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          ) : null}
        </div>
      </div>

      {!userId ? (
        <Link
          href="/sign-in"
          className="mb-4 inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Sign in
        </Link>
      ) : null}

      <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 hidden rounded-xl border bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white md:block">
        <p className="text-sm font-semibold">Launch Ready</p>
        <p className="mt-1 text-xs text-indigo-100">Review and share project updates with clients.</p>
        <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white/90">
          View activity
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
