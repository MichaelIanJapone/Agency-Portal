# Agency Portal — Multi-Tenant Client Delivery SaaS

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)
![License](https://img.shields.io/badge/license-MIT-green)

A production-oriented agency operations platform built with Next.js, Prisma, PostgreSQL, and Clerk.  
It provides secure account-scoped workspaces, project/task lifecycle management, activity auditing, and a responsive management dashboard.

---

## Overview

Agency Portal helps service teams run delivery workflows in one secure workspace:

- manage agencies, clients, projects, and tasks
- collaborate with status-driven delivery flow
- audit activity with timeline logs
- isolate data per signed-in account (tenant-like behavior)
- run smoothly on desktop and mobile

---

## Core Features

### Authentication & Access
- Clerk authentication (Email + Google capable)
- Protected dashboard routes
- Account-scoped data visibility (users only see their own workspace data)

### Agency & Client Management
- Create agencies with contact owner/email details
- Add clients per agency
- Quick setup flow for first-time users

### Project Lifecycle
- Create and edit projects
- Status workflow: `PLANNED`, `IN_PROGRESS`, `REVIEW`, `DONE`
- Close/reopen flow with business rules
- Archive and restore support

### Task Management
- Add, edit, complete, and delete tasks
- Task deadlines + overdue highlighting
- Per-project task board

### Activity & Dashboard
- Action logging to `ActivityLog`
- Dashboard KPIs (active/archived/projects/clients/tasks)
- Status distribution, upcoming deadlines, and activity timeline
- Mobile top bar + drawer menu navigation

---

## Tech Stack

**Frontend**
- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide icons

**Backend**
- Next.js server actions + route handlers
- Prisma ORM
- PostgreSQL
- Zod validation

**Auth**
- Clerk (`@clerk/nextjs`)

---

## Project Structure

- `src/app` — route pages and server components
- `src/components` — UI components (dashboard, theme, etc.)
- `src/modules` — domain logic (`projects`, `tasks`, `activity`)
- `src/lib` — shared utilities (`db`, `current-user`, etc.)
- `src/server` — shared HTTP errors and route error handling
- `prisma/schema.prisma` — data model

---

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="your_postgres_connection_string"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 3) Sync database schema

```bash
npm run db:push
npm run db:generate
```

### 4) Run dev server

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## Deployment (Vercel + Hosted Postgres)

1. Push code to GitHub
2. Import repository in Vercel
3. Add env vars in Vercel:
   - `DATABASE_URL` (hosted DB, not localhost)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Run schema sync against hosted DB:

```bash
npx prisma db push
```

5. Redeploy

> Note: `localhost` database URLs will not work in Vercel production.

---

## Scripts

- `npm run dev` — run local development server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — lint codebase
- `npm run db:push` — sync Prisma schema to DB
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — create/apply migration (dev)
- `npm run db:studio` — open Prisma Studio

---

## Current Roadmap

- role-based permissions (owner/member/client)
- billing and plan limits (Stripe)
- notifications and file attachments
- stronger test coverage + CI pipelines
- advanced filtering/search and reporting

---

## License

MIT
