import Link from "next/link";
import { revalidatePath } from "next/cache";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { logActivity } from "@/modules/activity/activity.service";
import { reopenProject } from "@/modules/projects/project.service";

export const dynamic = "force-dynamic";

async function reopenProjectAction(projectId: string) {
  "use server";
  const user = await requireCurrentAppUser();

  const project = await db.project.findFirst({
    where: { id: projectId, agency: { ownerId: user.id } },
    select: { id: true, agencyId: true, name: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  await reopenProject(project.id);
  await logActivity({
    agencyId: project.agencyId,
    actorId: user.id,
    action: "project.reopened",
    metadata: { projectId: project.id, projectName: project.name },
  });
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/projects/archive");
  revalidatePath("/dashboard");
}

type ArchivedProject = {
  id: string;
  name: string;
  client: { name: string };
  status: string;
  archivedAt: Date | null;
};

export default async function ArchivedProjectsPage() {
  const user = await requireCurrentAppUser();

  const projects: ArchivedProject[] = await db.project
    .findMany({
      where: { archivedAt: { not: null }, agency: { ownerId: user.id } },
      include: { client: true },
      orderBy: { archivedAt: "desc" },
      take: 30,
    })
    .catch(() => [] as ArchivedProject[]);

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Archived Projects</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Closed projects are kept here for history and reporting.</p>
          <Link href="/dashboard/projects" className="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            Back to active projects
          </Link>
        </header>

        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No archived projects yet.
            </div>
          ) : (
            projects.map((project) => (
              <article
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Client: {project.client.name} - Archived: {project.archivedAt?.toLocaleDateString() ?? "-"}
                  </p>
                </div>
                <form action={reopenProjectAction.bind(null, project.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Reopen
                  </button>
                </form>
              </article>
            ))
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
