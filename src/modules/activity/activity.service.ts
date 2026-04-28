import { db } from "@/lib/db";

type LogActivityInput = {
  agencyId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: LogActivityInput) {
  await db.activityLog.create({
    data: {
      agencyId: input.agencyId,
      actorId: input.actorId,
      action: input.action,
      metadata: input.metadata,
    },
  });
}
