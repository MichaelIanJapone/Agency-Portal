import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

import { db } from "@/lib/db";

export async function requireCurrentAppUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();

  if (!email) {
    throw new Error("No email address found for current account");
  }

  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() || email;

  const user = await db.user.upsert({
    where: { email },
    update: { fullName },
    create: {
      email,
      fullName,
      role: UserRole.OWNER,
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return user;
}
