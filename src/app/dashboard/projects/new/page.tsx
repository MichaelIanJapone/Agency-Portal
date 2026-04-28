import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { logActivity } from "@/modules/activity/activity.service";
import { createProjectSchema } from "@/modules/projects/project.schema";
import { createProject } from "@/modules/projects/project.service";

export const dynamic = "force-dynamic";

async function createProjectAction(formData: FormData) {
  "use server";
  const user = await requireCurrentAppUser();

  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "");
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();

  if (!clientId) {
    throw new Error("Client is required");
  }

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, agencyId: true },
  });

  if (!client) {
    throw new Error("Selected client was not found");
  }

  const agency = await db.agency.findFirst({
    where: { id: client.agencyId, ownerId: user.id },
    select: { id: true },
  });

  if (!agency) {
    throw new Error("You cannot create projects for this client.");
  }

  const payload = createProjectSchema.parse({
    agencyId: client.agencyId,
    clientId: client.id,
    name,
    description: descriptionRaw || undefined,
    dueDate: dueDateRaw ? new Date(`${dueDateRaw}T00:00:00.000Z`).toISOString() : undefined,
  });

  const project = await createProject(payload);
  await logActivity({
    agencyId: project.agencyId,
    actorId: user.id,
    action: "project.created",
    metadata: { projectId: project.id, projectName: project.name },
  });
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}

export default async function NewProjectPage() {
  const user = await requireCurrentAppUser();

  const clients = await db.client
    .findMany({
      where: { agency: { ownerId: user.id } },
      select: { id: true, name: true, agency: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Create New Project</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add a project and link it to one of your existing clients.
          </p>
        </header>

        {clients.length === 0 ? (
          <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No clients found yet. Create a client first, then come back to create a project.
            <div className="mt-3">
              <Link href="/dashboard/clients" className="text-indigo-600 hover:underline dark:text-indigo-400">
                Go to Clients
              </Link>
            </div>
          </div>
        ) : (
          <form
            action={createProjectAction}
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
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Website redesign"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Client</span>
              <select
                name="clientId"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                defaultValue={clients[0]?.id}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.agency.name})
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
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Scope, goals, and key notes"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Due date (optional)</span>
              <input
                type="date"
                name="dueDate"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Create Project
              </button>
              <Link href="/dashboard/projects" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </section>
    </DashboardShell>
  );
}
