import Link from "next/link";
import { ListChecks, PencilLine, Plus } from "lucide-react";

import { db } from "@/lib/db";
import { requireCurrentAppUser } from "@/lib/current-user";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

type ProjectWithClientAndTasks = {
  id: string;
  name: string;
  status: string;
  client: { name: string };
  tasks: { id: string }[];
};

export default async function ProjectsPage() {
  const user = await requireCurrentAppUser();

  const projects: ProjectWithClientAndTasks[] = await db.project
    .findMany({
      where: { archivedAt: null, agency: { ownerId: user.id } },
      include: {
        client: true,
        tasks: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    .catch(() => [] as ProjectWithClientAndTasks[]);

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Projects</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Latest client-facing work and review status.</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Active
              </span>
              <Link href="/dashboard/projects/archive" className="text-zinc-500 hover:underline dark:text-zinc-400">
                View archived projects
              </Link>
            </div>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </header>

        <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{project.name}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{project.client.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {project.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                      title="Open task board"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      View Tasks ({project.tasks.length})
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                        title="View Tasks"
                        aria-label="View Tasks"
                      >
                        <ListChecks className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                        title="Edit Project"
                        aria-label="Edit Project"
                      >
                        <PencilLine className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {projects.map((project) => (
            <article key={project.id} className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{project.name}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{project.client.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {project.status.replaceAll("_", " ")}
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    View Tasks ({project.tasks.length})
                  </Link>
                  <Link
                    href={`/dashboard/projects/${project.id}/edit`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                    title="Edit Project"
                    aria-label="Edit Project"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
