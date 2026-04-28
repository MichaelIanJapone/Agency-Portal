import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProjectStatus } from "@prisma/client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { logActivity } from "@/modules/activity/activity.service";
import { updateProjectSchema } from "@/modules/projects/project.schema";
import { getProjectById, updateProject } from "@/modules/projects/project.service";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: ProjectStatus[] = ["PLANNED", "IN_PROGRESS", "REVIEW", "DONE"];

async function updateProjectAction(projectId: string, formData: FormData) {
  "use server";
  const user = await requireCurrentAppUser();

  const project = await db.project.findFirst({
    where: { id: projectId, agency: { ownerId: user.id } },
    select: { id: true, agencyId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();

  const payload = updateProjectSchema.parse({
    agencyId: project.agencyId,
    clientId: String(formData.get("clientId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    dueDate: dueDateRaw ? new Date(`${dueDateRaw}T00:00:00.000Z`).toISOString() : undefined,
    status: String(formData.get("status") ?? "PLANNED"),
  });

  const updatedProject = await updateProject(projectId, payload);
  await logActivity({
    agencyId: updatedProject.agencyId,
    actorId: user.id,
    action: "project.updated",
    metadata: {
      projectId: updatedProject.id,
      projectName: updatedProject.name,
      status: updatedProject.status,
    },
  });
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  redirect("/dashboard/projects");
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentAppUser();
  const { id } = await params;
  const project = await getProjectById(id).catch(() => null);

  if (!project || project.agency.ownerId !== user.id) {
    notFound();
  }

  const clients = await db.client
    .findMany({
      where: { agencyId: project.agencyId, agency: { ownerId: user.id } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
    .catch(() => []);

  const formattedDueDate = project.dueDate
    ? new Date(project.dueDate).toISOString().slice(0, 10)
    : "";

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Edit Project</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Update project details, status, and due date.</p>
        </header>

        <form
          action={updateProjectAction.bind(null, id)}
          className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Project name</span>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={120}
              defaultValue={project.name}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Client</span>
            <select
              name="clientId"
              required
              defaultValue={project.clientId}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Status</span>
            <select
              name="status"
              defaultValue={project.status}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Description (optional)</span>
            <textarea
              name="description"
              rows={4}
              maxLength={2000}
              defaultValue={project.description ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Due date (optional)</span>
            <input
              type="date"
              name="dueDate"
              defaultValue={formattedDueDate}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Save Changes
            </button>
            <Link href="/dashboard/projects" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </DashboardShell>
  );
}
