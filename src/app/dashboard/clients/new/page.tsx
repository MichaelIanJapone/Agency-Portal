import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { logActivity } from "@/modules/activity/activity.service";

export const dynamic = "force-dynamic";

async function createClientAction(formData: FormData) {
  "use server";
  const user = await requireCurrentAppUser();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const agencyId = String(formData.get("agencyId") ?? "").trim();

  if (!name || !email || !agencyId) {
    throw new Error("Name, email, and agency are required.");
  }

  const agency = await db.agency.findFirst({
    where: { id: agencyId, ownerId: user.id },
    select: { id: true },
  });

  if (!agency) {
    throw new Error("Invalid agency selection.");
  }

  const client = await db.client.create({
    data: {
      name,
      email,
      agencyId: agency.id,
    },
  });

  await logActivity({
    agencyId: agency.id,
    actorId: user.id,
    action: "client.created",
    metadata: { clientId: client.id, clientName: client.name, clientEmail: client.email },
  });

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export default async function NewClientPage() {
  const user = await requireCurrentAppUser();

  const agencies = await db.agency
    .findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Add Client</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Create a new client under an agency workspace.</p>
        </header>

        {agencies.length === 0 ? (
          <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No agencies found yet. Create an agency record first, then add clients.
            <div className="mt-3">
              <Link href="/dashboard/agencies/new" className="text-indigo-600 hover:underline dark:text-indigo-400">
                Create Agency
              </Link>
            </div>
          </div>
        ) : (
          <form
            action={createClientAction}
            className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Client name</span>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Acme Inc."
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Client email</span>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="team@acme.com"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Agency</span>
              <select
                name="agencyId"
                defaultValue={agencies[0]?.id}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Save Client
              </button>
              <Link href="/dashboard/clients" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </section>
    </DashboardShell>
  );
}
