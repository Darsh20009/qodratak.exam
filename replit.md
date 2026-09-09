# منصة قدراتك — Replit run notes

## Start the app

The project uses the existing pnpm workspace with a Vite frontend and Express API.
Install the locked dependencies once:

```bash
pnpm install --frozen-lockfile
```

Use the artifact-owned workflows for normal development:

- `artifacts/qodratak: web` serves the root web preview.
- `artifacts/api-server: API Server` runs the Express backend.

Replit injects each service's `PORT` and the web app's `BASE_PATH`. The frontend
proxies `/api` requests and WebSocket upgrades to the API service during
development.

## Current environment

`MONGODB_URI` is configured in Replit Secrets. The API uses the existing MongoDB
dataset for accounts, progress, questions, subscriptions, and persistent
sessions. If the secret is unavailable in a development fork, the app falls
back to in-memory preview data and development-only demo accounts.

Optional features such as AI assistance, email, OAuth, payments, WebAuthn, and
push notifications require their corresponding environment variables. The
available example is `artifacts/api-server/.env.example`.

Do not place credentials in the repository. Use Replit Secrets for all
environment values.

## Architecture decisions

- The imported React/Vite frontend remains the root preview, while the imported
  Express API runs as a separate local service.
- Development API traffic is proxied from Vite to the API service so the
  existing `/api/*` client routes and session cookies continue to work.
- The API intentionally keeps its local in-memory fallback for previews when
  MongoDB/PostgreSQL credentials are not configured.


## Product

_Describe the high-level user-facing capabilities of this app once they exist._


## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server manually (requires `PORT`)
- `pnpm --filter @workspace/qodratak run dev` — run the web app manually (requires `PORT` and `BASE_PATH`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required preview env: `SESSION_SECRET`
- Optional durable env: `MONGODB_URI` and/or `DATABASE_URL`


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
