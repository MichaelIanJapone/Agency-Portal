import Link from "next/link";
import { db } from "@/lib/db";
import { requireCurrentAppUser } from "@/lib/current-user";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Mail, Plus, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

type ClientWithProjects = {
  id: string;
  name: string;
  email: string;
  projects: { id: string }[];
};

export default async function ClientsPage() {
  const user = await requireCurrentAppUser();

  const clients: ClientWithProjects[] = await db.client
    .findMany({
      where: { agency: { ownerId: user.id } },
      include: {
        projects: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    .catch(() => [] as ClientWithProjects[]);

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Clients</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage client accounts and active project load.</p>
          </div>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <article key={client.id} className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 inline-flex rounded-lg bg-violet-100 p-2 dark:bg-violet-900/40">
                <UserRound className="h-4 w-4 text-violet-700" />
              </div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{client.name}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </p>
              <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">{client.projects.length} active project(s)</p>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
