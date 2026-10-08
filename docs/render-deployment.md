# Deploy the current Qodratak application to Render

## Source and build

- Repository: `Darsh20009/qodratak.exam`.
- Branch: `main`.
- Use the repository-root `Dockerfile`, not `.migration-backup`.
- The Dockerfile builds `artifacts/qodratak` and `artifacts/api-server`.
- It explicitly installs development dependencies because Vite and esbuild are build tools.
- Production starts with `node artifacts/api-server/start.mjs`; this sets the working directory to the repository root and serves the current frontend build.
- Do not use the old `npm ci` commands from `.migration-backup/render.yaml`; the current repository is a pnpm workspace.

## Secrets and persistent data

GitHub does not transfer workspace secrets to Render. Configure them privately in Render, never in source:

- `MONGODB_URI`: the intended existing MongoDB database, including its database name. New progress, reports, and learning records are stored here. Do not replace or reseed the existing dataset.
- `SESSION_SECRET`: keep the configured production value stable.
- `OPENAI_API_KEY`: needed only for AI features; existing explanations and deterministic reports do not need generation.
- `GEIDEA_TEST_PUBLIC_KEY` and `GEIDEA_TEST_API_PASSWORD`: sandbox payment credentials, not live-payment credentials.
- Persistent-media and WhatsApp provider settings required by the existing installation, including `QIROX_PROJECT_API_KEY` and Cloudflare R2 credentials when those providers are used.
- `FOUNDATION_ASSET_BASE_URL`: the validated public location of the hosted quantitative foundation files if production uses the foundation-media redirect. Set the actual existing public base, not a guessed URL.

Student data and hosted media are not copied by a Git push. Their availability depends on using the same intended database and persistent-media settings in Render.

## Media checkout blocker

The current repository contains about 57 GB of materialized Git LFS assets. A Render checkout that downloads all of them can exceed its 32 GB checkout-volume limit before Docker runs. A successful local build does not prove that this checkout will succeed.

Do not delete original uploads or rewrite repository history as a workaround. Before changing asset tracking, verify the required files are available from persistent hosting, preserve local originals, and obtain approval for the Git packaging change. Excluding files in `.dockerignore` does not by itself fix an oversized Git checkout.

## Verify the actual release

After deploying, confirm Render built the intended latest `main` commit and the repository-root Dockerfile. Check the logs for successful MongoDB startup, then verify sign-in, the dashboard's «نتائجي» link, saved report details, and older-results loading. Ensure paid training stays locked after an expired trial even though owned results remain readable.

A GitHub push is not proof that Render deployed successfully. Automatic deployment depends on the service's settings.
