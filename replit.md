# Replit run notes

## Start the app

The project uses the existing Node.js/Express + Vite stack:

```bash
npm ci
npm run dev
```

The `Start application` workflow runs `npm run dev` and serves the web preview
on port `5000`.

## Current environment

The app starts without external database credentials by using its local
in-memory storage fallback. This is suitable for previewing the interface, but
data, accounts, and sessions are not durable between restarts.

For durable operation, configure `MONGODB_URI` in Replit Secrets. Optional
features such as AI assistance, email, OAuth, payments, WebAuthn, and push
notifications require their corresponding environment variables described in
`README.md`.

Do not place credentials in the repository. Use Replit Secrets for all
environment values.

# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._


## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._


## Product

_Describe the high-level user-facing capabilities of this app once they exist._


## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string


## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._


## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._


## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._


## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)


## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
