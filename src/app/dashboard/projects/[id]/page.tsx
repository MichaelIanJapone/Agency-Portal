import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { logActivity } from "@/modules/activity/activity.service";
import { closeProject } from "@/modules/projects/project.service";
import { createTaskSchema, updateTaskSchema } from "@/modules/tasks/task.schema";
import { createTask, deleteTask, updateTask } from "@/modules/tasks/task.service";

export const dynamic = "force-dynamic";

async function createTaskAction(projectId: string, formData: FormData) {
  "use server";
  const user = await requireCurrentAppUser();

  const project = await db.project.findFirst({
    where: { id: projectId, agency: { ownerId: user.id } },
    select: { id: true, agencyId: true, name: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const payload = createTaskSchema.parse({
    projectId,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    dueDate: dueDateRaw ? new Date(`${dueDateRaw}T00:00:00.000Z`).toISOString() : undefined,
  });

  await createTask(payload);
  await logActivity({
    agencyId: project.agencyId,
    actorId: user.id,
    action: "task.created",
    metadata: { projectId: project.id, projectName: project.name, title: payload.title },
  });
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
}

async function updateTaskAction(projectId: string, taskId: string, formData: FormData) {
  "use server";
  const user = await requireCurrentAppUser();

  const task = await db.task.findFirst({
    where: { id: taskId, projectId, project: { agency: { ownerId: user.id } } },
    select: { id: true, title: true, project: { select: { agencyId: true, name: true } } },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const payload = updateTaskSchema.parse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    dueDate: dueDateRaw ? new Date(`${dueDateRaw}T00:00:00.000Z`).toISOString() : undefined,
    isCompleted: formData.get("isCompleted") === "on",
  });

  const updatedTask = await updateTask(task.id, payload);
  await logActivity({
    agencyId: task.project.agencyId,
    actorId: user.id,
    action: "task.updated",
    metadata: {
      taskId: updatedTask.id,
      title: updatedTask.title,
      projectName: task.project.name,
      isCompleted: updatedTask.isCompleted,
    },
  });
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
}

async function deleteTaskAction(projectId: string, taskId: string) {
  "use server";
  const user = await requireCurrentAppUser();

  const task = await db.task.findFirst({
    where: { id: taskId, projectId, project: { agency: { ownerId: user.id } } },
    select: { id: true, title: true, project: { select: { agencyId: true, name: true } } },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await logActivity({
    agencyId: task.project.agencyId,
    actorId: user.id,
    action: "task.deleted",
    metadata: { taskId: task.id, title: task.title, projectName: task.project.name },
  });
  await deleteTask(task.id);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
}

async function closeProjectAction(projectId: string) {
  "use server";
  const user = await requireCurrentAppUser();

  const project = await db.project.findFirst({
    where: { id: projectId, agency: { ownerId: user.id } },
    select: { id: true, agencyId: true, name: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  await closeProject(project.id);
  await logActivity({
    agencyId: project.agencyId,
    actorId: user.id,
    action: "project.closed",
    metadata: { projectId: project.id, projectName: project.name },
  });
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/projects/archive");
  revalidatePath("/dashboard");
}

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentAppUser();
  const { id } = await params;
  const project = await db.project
    .findFirst({
      where: { id, agency: { ownerId: user.id } },
      include: {
        client: { select: { name: true } },
        tasks: { orderBy: { createdAt: "desc" } },
      },
    })
    .catch(() => null);

  if (!project) {
    notFound();
  }

  const allTasksCompleted = project.tasks.every((task) => task.isCompleted);
  const canClose = project.status === "DONE" && allTasksCompleted && !project.archivedAt;

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Client: {project.client.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/projects/${project.id}/edit`}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Edit Project
              </Link>
              <form action={closeProjectAction.bind(null, project.id)}>
                <button
                  type="submit"
                  disabled={!canClose}
                  title={
                    canClose
                      ? "Close and archive project"
                      : "Set project to DONE and complete all tasks first"
                  }
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {project.archivedAt ? "Archived" : "Close Project"}
                </button>
              </form>
              <Link
                href="/dashboard/projects"
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Back to Projects
              </Link>
            </div>
          </div>
          {!canClose && !project.archivedAt ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              To close this project, set status to DONE and complete all tasks.
            </p>
          ) : null}
        </header>

        <form
          action={createTaskAction.bind(null, project.id)}
          className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-6"
        >
          <input
            type="text"
            name="title"
            required
            minLength={2}
            maxLength={160}
            placeholder="New task title"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 md:col-span-2"
          />
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 md:col-span-2"
          />
          <input
            type="date"
            name="dueDate"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Add Task
          </button>
        </form>

        <div className="space-y-3">
          {project.tasks.length === 0 ? (
            <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No tasks yet. Add your first task above.
            </div>
          ) : (
            project.tasks.map((task) => {
              const defaultDueDate = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "";

              return (
                <form
                  key={task.id}
                  action={updateTaskAction.bind(null, project.id, task.id)}
                  className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="grid gap-3 md:grid-cols-6">
                    <input
                      type="text"
                      name="title"
                      required
                      minLength={2}
                      maxLength={160}
                      defaultValue={task.title}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 md:col-span-2"
                    />
                    <input
                      type="text"
                      name="description"
                      defaultValue={task.description ?? ""}
                      placeholder="Description"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 md:col-span-2"
                    />
                    <input
                      type="date"
                      name="dueDate"
                      defaultValue={defaultDueDate}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        name="isCompleted"
                        defaultChecked={task.isCompleted}
                        className="h-4 w-4 rounded border-zinc-400 text-indigo-600 focus:ring-indigo-500"
                      />
                      Done
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        task.isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {task.isCompleted ? "Completed" : "Todo"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                      >
                        Save
                      </button>
                      <button
                        type="submit"
                        formAction={deleteTaskAction.bind(null, project.id, task.id)}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </form>
              );
            })
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
