import { db } from "@/lib/db";
import type { CreateProjectInput, UpdateProjectInput } from "@/modules/projects/project.schema";
import { ProjectStatus } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/server/http-errors";

export async function listProjectsByAgency(agencyId: string) {
  if (!agencyId) {
    throw new ValidationError("agencyId is required");
  }

  return db.project.findMany({
    where: { agencyId },
    include: {
      client: true,
      tasks: {
        select: { id: true, isCompleted: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(input: CreateProjectInput) {
  const client = await db.client.findFirst({
    where: {
      id: input.clientId,
      agencyId: input.agencyId,
    },
  });

  if (!client) {
    throw new NotFoundError("Client does not exist in this agency");
  }

  return db.project.create({
    data: {
      agencyId: input.agencyId,
      clientId: input.clientId,
      name: input.name,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

export async function getProjectById(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      agency: {
        select: { ownerId: true },
      },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, agencyId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const client = await db.client.findFirst({
    where: {
      id: input.clientId,
      agencyId: input.agencyId,
    },
    select: { id: true },
  });

  if (!client) {
    throw new NotFoundError("Client does not exist in this agency");
  }

  return db.project.update({
    where: { id: projectId },
    data: {
      clientId: input.clientId,
      name: input.name,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: input.status as ProjectStatus,
    },
  });
}

export async function closeProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      archivedAt: true,
      tasks: { select: { isCompleted: true } },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.archivedAt) {
    return project;
  }

  if (project.status !== "DONE") {
    throw new ValidationError("Project must be set to DONE before closing.");
  }

  if (project.tasks.some((task) => !task.isCompleted)) {
    throw new ValidationError("All tasks must be completed before closing.");
  }

  return db.project.update({
    where: { id: projectId },
    data: { archivedAt: new Date() },
  });
}

export async function reopenProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return db.project.update({
    where: { id: projectId },
    data: { archivedAt: null },
  });
}
