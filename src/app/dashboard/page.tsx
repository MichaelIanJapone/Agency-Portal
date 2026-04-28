import Link from "next/link";
import { Prisma, ProjectStatus } from "@prisma/client";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CircleCheckBig,
  ClipboardList,
  FolderKanban,
  Plus,
  Timer,
  Users,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentAppUser();
  const ownedAgencyIds = await db.agency
    .findMany({
      where: { ownerId: user.id },
      select: { id: true },
    })
    .then((agencies) => agencies.map((agency) => agency.id))
    .catch(() => []);
  const ownedAgencyWhere = { ownerId: user.id };

  const [
    projectsCount,
    clientsCount,
    tasksCount,
    archivedProjectsCount,
    recentProjects,
    upcomingTasks,
    recentActivityLogs,
    statusCounts,
  ] =
    await Promise.all([
    db.project.count({ where: { agency: ownedAgencyWhere, archivedAt: null } }).catch(() => 0),
    db.client.count({ where: { agency: { ownerId: user.id } } }).catch(() => 0),
    db.task.count({ where: { project: { agency: { ownerId: user.id }, archivedAt: null } } }).catch(() => 0),
    db.project.count({ where: { agency: ownedAgencyWhere, archivedAt: { not: null } } }).catch(() => 0),
    db.project
      .findMany({
        where: { agency: ownedAgencyWhere, archivedAt: null },
        include: {
          client: { select: { name: true } },
          tasks: { select: { id: true, isCompleted: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      })
      .catch(() => []),
    db.task
      .findMany({
        where: {
          project: { agency: ownedAgencyWhere, archivedAt: null },
          dueDate: { not: null },
          isCompleted: false,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      })
      .catch(() => []),
    db.activityLog
      .findMany({
        where: { agencyId: { in: ownedAgencyIds } },
        include: { actor: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
      .catch(() => []),
    Promise.all(
      (["PLANNED", "IN_PROGRESS", "REVIEW", "DONE"] as ProjectStatus[]).map(async (status) => ({
        status,
        count: await db.project
          .count({
            where: { agency: ownedAgencyWhere, archivedAt: null, status },
          })
          .catch(() => 0),
      })),
    ),
  ]);

  const agenciesCount = ownedAgencyIds.length;
  const hasAnyWorkspaceData = agenciesCount > 0 || clientsCount > 0 || projectsCount > 0;
  const totalStatusCount = statusCounts.reduce((sum, item) => sum + item.count, 0);
  const activityTimeline = recentActivityLogs.map((log) => {
    const metadata = toRecord(log.metadata);
    const projectName = readMetaString(metadata, "projectName");
    const taskTitle = readMetaString(metadata, "title");
    const actorName = log.actor.fullName || "Someone";
    const label = formatActivityLabel(log.action, { projectName, taskTitle, actorName });
    const sublabel = formatActivitySubLabel(log.action, { projectName, taskTitle });

    return {
      id: log.id,
      label,
      sublabel,
      occurredAt: log.createdAt,
    };
  });

  return (
    <DashboardShell>
      <section className="space-y-5">
        <header className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                Agency Dashboard
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                Track your clients, projects, deadlines, and delivery momentum in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickAction href="/dashboard/agencies/new" label="New Agency" />
              <QuickAction href="/dashboard/clients/new" label="Add Client" />
              <QuickAction href="/dashboard/projects/new" label="Create Project" />
            </div>
          </div>
        </header>

        {!hasAnyWorkspaceData ? (
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90 sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Get set up in three steps</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your workspace is private to this signed-in account. Create your first records to start collaborating.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <SetupStep
                href="/dashboard/agencies/new"
                step="1"
                title="Create your agency"
                description="Start with the main workspace your projects and clients belong to."
              />
              <SetupStep
                href="/dashboard/clients/new"
                step="2"
                title="Add a client"
                description="Create client records so projects can be associated with the right company."
              />
              <SetupStep
                href="/dashboard/projects/new"
                step="3"
                title="Create a project"
                description="Track progress, tasks, status changes, and deadlines in one shared flow."
              />
            </div>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active Projects"
            value={projectsCount}
            icon={<FolderKanban className="h-5 w-5 text-indigo-600" />}
          />
          <MetricCard
            label="Active Clients"
            value={clientsCount}
            icon={<Users className="h-5 w-5 text-violet-600" />}
          />
          <MetricCard
            label="Open Tasks"
            value={tasksCount}
            icon={<CircleCheckBig className="h-5 w-5 text-emerald-600" />}
          />
          <MetricCard
            label="Archived Projects"
            value={archivedProjectsCount}
            icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr,0.95fr]">
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Projects by status</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  A quick view of where active delivery work stands.
                </p>
              </div>
              <Link
                href="/dashboard/projects"
                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View projects
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {statusCounts.map((item) => (
                <StatusCard key={item.status} status={item.status} count={item.count} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status distribution</p>
              {statusCounts.map((item) => {
                const percentage = totalStatusCount === 0 ? 0 : Math.round((item.count / totalStatusCount) * 100);
                return (
                  <div key={`bar-${item.status}`} className="rounded-xl border border-zinc-200/80 p-2.5 dark:border-zinc-800/80">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{item.status.replaceAll("_", " ")}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800/90">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Upcoming deadlines</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Tasks that need attention soon.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingTasks.length === 0 ? (
                <EmptyPanelMessage message="No upcoming task deadlines right now." />
              ) : (
                upcomingTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-zinc-200/80 p-4 transition hover:border-zinc-300 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{task.project.name}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isOverdue(task.dueDate)
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}
                      >
                        {isOverdue(task.dueDate) ? "Overdue: " : ""}
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent project activity</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your latest active projects and how far they have progressed.
              </p>
            </div>
            <Link
              href="/dashboard/projects/archive"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View archive
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {recentProjects.length === 0 ? (
              <div className="lg:col-span-2">
                <EmptyPanelMessage message="No active projects yet. Create a project to populate this section." />
              </div>
            ) : (
              recentProjects.map((project) => {
                const completedTasks = project.tasks.filter((task) => task.isCompleted).length;
                const totalTasks = project.tasks.length;
                const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                return (
                  <article
                    key={project.id}
                    className="rounded-2xl border border-zinc-200/80 p-5 transition hover:border-zinc-300 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</p>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          Client: {project.client.name}
                        </p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {project.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">Task progress</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {completedTasks}/{totalTasks || 0} complete
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800/90">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Updated {formatRelativeDate(project.updatedAt)}
                      </p>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent activity timeline</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Latest updates from projects and tasks in your workspace.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {activityTimeline.length === 0 ? (
              <EmptyPanelMessage message="No activity yet. Start by creating an agency, client, and project." />
            ) : (
              activityTimeline.map((item) => (
                <article
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 p-4 transition hover:border-zinc-300 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                      <Timer className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.label}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.sublabel}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatRelativeDate(item.occurredAt)}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
    >
      <Plus className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
    </article>
  );
}

function SetupStep({
  step,
  title,
  description,
  href,
}: {
  step: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-200/80 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-zinc-800/80 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
    >
      <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
        Step {step}
      </span>
      <p className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </Link>
  );
}

function StatusCard({ status, count }: { status: ProjectStatus; count: number }) {
  return (
    <article className="rounded-xl border border-zinc-200/80 p-4 dark:border-zinc-800/80">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{status.replaceAll("_", " ")}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{count}</p>
    </article>
  );
}

function EmptyPanelMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      {message}
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatRelativeDate(date: Date) {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diffHours = Math.round((now - target) / (1000 * 60 * 60));

  if (diffHours < 24) {
    return `${Math.max(diffHours, 1)}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function isOverdue(date: Date | null) {
  if (!date) {
    return false;
  }

  return new Date(date).getTime() < Date.now();
}

function toRecord(value: Prisma.JsonValue | null): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

function readMetaString(metadata: Record<string, Prisma.JsonValue>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

function formatActivityLabel(
  action: string,
  context: { projectName: string | null; taskTitle: string | null; actorName: string },
) {
  switch (action) {
    case "agency.created":
      return `${context.actorName} created a new agency`;
    case "client.created":
      return `${context.actorName} added a new client`;
    case "project.created":
      return `${context.actorName} created project "${context.projectName ?? "Untitled"}"`;
    case "project.updated":
      return `${context.actorName} updated project "${context.projectName ?? "Untitled"}"`;
    case "project.closed":
      return `${context.actorName} closed project "${context.projectName ?? "Untitled"}"`;
    case "project.reopened":
      return `${context.actorName} reopened project "${context.projectName ?? "Untitled"}"`;
    case "task.created":
      return `${context.actorName} created task "${context.taskTitle ?? "Untitled task"}"`;
    case "task.updated":
      return `${context.actorName} updated task "${context.taskTitle ?? "Untitled task"}"`;
    case "task.deleted":
      return `${context.actorName} deleted task "${context.taskTitle ?? "Untitled task"}"`;
    default:
      return `${context.actorName} performed an update`;
  }
}

function formatActivitySubLabel(
  action: string,
  context: { projectName: string | null; taskTitle: string | null },
) {
  if (action.startsWith("task.")) {
    return context.projectName ? `Project: ${context.projectName}` : "Task activity";
  }

  if (action.startsWith("project.")) {
    return context.projectName ? `Project: ${context.projectName}` : "Project activity";
  }

  return "Workspace activity";
}
