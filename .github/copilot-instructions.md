<!-- Project-specific Copilot instructions for contributors and AI assistants -->
# Copilot instructions — ltu-a1

This file contains quick, concrete guidance for AI coding agents working in this repository (a small Next.js 13+/App Router project with Prisma + SQLite). Keep edits brief and only change files under the user's request.

1) Big picture
- Next.js App Router (app/) renders UI. Key pages: `app/page.tsx` (tabs generator), `app/saves` and `app/qa` (CRUD UIs).
- Server API routes live in `app/api/*/route.ts`. They use `lib/prisma.ts` to access a SQLite DB (`prisma/dev.db`) defined by `prisma/schema.prisma`.

2) Common workflows & commands
- Run dev: `npm run dev` (starts Next dev server at http://localhost:3000).
- Build: `npm run build` and `npm run start` for production.
- Prisma: schema is in `prisma/schema.prisma`. Use `npx prisma migrate dev` to apply migrations and `npx prisma studio` to inspect data.

3) Patterns & conventions (project-specific)
- Runtime: Files under `app/` follow the App Router. Client components use `"use client"` (e.g. `app/page.tsx`). Server handlers are default exported route handlers in `app/api/*/route.ts` using NextResponse.
- DB model names: Prisma model `Save` and `QA` map to `prisma.save` and `prisma.qA` usages in code — note the Prisma client field name for QA is `qA` (camel-case in generated client). Search for `.qA` if you need the QA model.
- Prisma client: `lib/prisma.ts` attaches a global `prisma` instance in dev to avoid multiple clients during HMR. Never instantiate Prisma client elsewhere; import `prisma` from `@/lib/prisma`.
- Payloads: `Save.payload` stores JSON as a string. API routes stringify/parse payloads. Keep payload size modest and validate expected keys (`type`, `payload`).

4) API rules & examples
- `GET /api/saves` — returns recent saves (see `app/api/saves/route.ts`).
- `POST /api/saves` — expects { type, payload } JSON; returns created Save.
- `GET /api/qa` — returns recent QA rows; `POST /api/qa` — expects { slug, question, answer } and upserts by slug.

5) Editing & tests
- TypeScript + ESLint are configured (see `tsconfig.json` and `eslint.config.mjs`), but the repo doesn't include automated tests. Prefer small, local smoke tests: run `npm run dev` and exercise the UI and API using curl or the browser.

6) Files to inspect when changing behavior
- UI: `app/page.tsx`, `app/saves/page.tsx` (CRUD UI), `app/qa/page.tsx`.
- Server/API: `app/api/saves/*`, `app/api/qa/route.ts`.
- DB: `prisma/schema.prisma`, `lib/prisma.ts`.

7) Safe edit checklist for AI agents
- Keep changes minimal and follow existing style (inline styles used widely in UI components).
- Run `npm run build` or `tsc` locally after changes when possible; ensure `lib/prisma.ts` import is preserved.
- When changing DB shape, add a Prisma migration and mention that manual migration was added.

If anything above is unclear or you need a deeper code tour (data flows, auth, or deployment), ask for clarification and I'll open the referenced files and add examples.
