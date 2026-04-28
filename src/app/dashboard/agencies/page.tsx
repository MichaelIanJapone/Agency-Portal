import Link from "next/link";
import { Building2, Plus } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AgencyWithOwner = {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  owner: {
    fullName: string;
    email: string;
  };
};

export default async function AgenciesPage() {
  const user = await requireCurrentAppUser();

  const agencies: AgencyWithOwner[] = await db.agency
    .findMany({
      where: { ownerId: user.id },
      include: {
        owner: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    .catch(() => [] as AgencyWithOwner[]);

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Agencies</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Create and manage agency workspaces.</p>
          </div>
          <Link
            href="/dashboard/agencies/new"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Add Agency
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency) => (
            <article
              key={agency.id}
              className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/40">
                <Building2 className="h-4 w-4 text-indigo-700" />
              </div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{agency.name}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Client owner: {agency.contactName ?? "-"} ({agency.contactEmail ?? "-"})
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                Account owner: {agency.owner.fullName}
              </p>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
