import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Layers3, ShieldCheck } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0e7ff_0%,_#ffffff_45%)] dark:bg-[radial-gradient(circle_at_top,_#1f1b3a_0%,_#09090b_45%)]">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex w-fit items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:text-sm">
              Client Portal for Agencies
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              Deliver client projects with clarity, speed, and confidence.
            </h1>
            <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
              A modern SaaS starter with scalable architecture, clean dashboard UX, and API-first modules
              to help agencies launch fast.
            </p>

            <div className="flex flex-wrap gap-3">
              {userId ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Sign In to Continue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <a
                href="https://www.prisma.io/docs"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Prisma Docs
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<Layers3 className="h-5 w-5 text-indigo-600" />}
              title="Organized Workspaces"
              description="Keep team updates, files, and approvals in one place."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
              title="Scalable Architecture"
              description="Module-based backend and typed APIs ready for growth."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-5 w-5 text-violet-600" />}
              title="Client Transparency"
              description="Share progress and decisions with a polished portal."
              className="sm:col-span-2"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <article className={`rounded-2xl border bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 ${className ?? ""}`}>
      <div className="mb-3 inline-flex rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">{icon}</div>
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </article>
  );
}
