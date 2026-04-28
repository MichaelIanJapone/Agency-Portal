import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentAppUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { logActivity } from "@/modules/activity/activity.service";

export const dynamic = "force-dynamic";

async function createAgencyAction(formData: FormData) {
  "use server";
  const user = await requireCurrentAppUser();

  const agencyName = String(formData.get("agencyName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();

  if (!agencyName || !contactName || !contactEmail) {
    throw new Error("Agency name, contact name, and contact email are required.");
  }

  const agency = await db.agency.create({
    data: {
      name: agencyName,
      contactName,
      contactEmail,
      ownerId: user.id,
    },
  });

  await logActivity({
    agencyId: agency.id,
    actorId: user.id,
    action: "agency.created",
    metadata: { agencyName: agency.name, contactName, contactEmail },
  });

  revalidatePath("/dashboard/agencies");
  revalidatePath("/dashboard/clients/new");
  redirect("/dashboard/agencies");
}

export default function NewAgencyPage() {
  return (
    <DashboardShell>
      <section className="space-y-4">
        <header className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Add Agency</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Create an agency workspace for your account.</p>
        </header>

        <form
          action={createAgencyAction}
          className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Agency name</span>
            <input
              type="text"
              name="agencyName"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="BrightWave Agency"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Agency owner / contact name</span>
            <input
              type="text"
              name="contactName"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Juan Dela Cruz"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Company email</span>
            <input
              type="email"
              name="contactEmail"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="owner@company.com"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Save Agency
            </button>
            <Link href="/dashboard/agencies" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </DashboardShell>
  );
}
