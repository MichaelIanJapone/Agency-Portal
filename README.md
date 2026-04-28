# Agency Client Portal SaaS Starter

Production-ready Next.js starter for building an agency client portal with a clean architecture and SaaS-friendly patterns.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- Clerk Authentication (Google/Email)
- Zod for validation
- Tailwind CSS for UI

## Project Structure

- `src/app`: routes and server components
- `src/app/api`: route handlers (thin controller layer)
- `src/modules`: domain modules (`projects`, etc.)
- `src/lib`: shared runtime utilities (`db`, `utils`)
- `src/server`: shared HTTP errors + route error handling
- `prisma/schema.prisma`: data model for agencies, clients, projects, tasks, and approvals

## Quick Start

1. Install dependencies
   - `npm install`
2. Configure environment
   - copy `.env.example` to `.env`
   - update `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`
3. Generate Prisma client and sync schema
   - `npm run db:generate`
   - `npm run db:push`
4. Start dev server
   - `npm run dev`

## Available Scripts

- `npm run dev`: start local development
- `npm run build`: production build
- `npm run lint`: lint project
- `npm run db:generate`: generate Prisma client
- `npm run db:push`: push schema to database
- `npm run db:migrate`: create/apply migrations
- `npm run db:studio`: open Prisma Studio

## Next Steps

- Add role-based authorization (owner/member/client permissions)
- Add file storage integration (S3/Supabase)
- Add billing and subscription enforcement (Stripe)
- Add unit/integration tests for module services and API routes
