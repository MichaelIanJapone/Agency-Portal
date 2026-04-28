import { z } from "zod";

export const createProjectSchema = z.object({
  agencyId: z.string().min(1),
  clientId: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.extend({
  status: z.enum(["PLANNED", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
