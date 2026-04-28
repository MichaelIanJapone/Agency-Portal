import { db } from "@/lib/db";
import type { CreateTaskInput, UpdateTaskInput } from "@/modules/tasks/task.schema";
import { NotFoundError } from "@/server/http-errors";

export async function createTask(input: CreateTaskInput) {
  const project = await db.project.findUnique({
    where: { id: input.projectId },
    select: { id: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return db.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  return db.task.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      isCompleted: input.isCompleted,
    },
  });
}

export async function deleteTask(taskId: string) {
  return db.task.delete({
    where: { id: taskId },
  });
}
