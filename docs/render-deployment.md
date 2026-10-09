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
- `CLOUDFLARE_R2_ACCOUNT_ID` and `CLOUDFLARE_R2_BUCKET_NAME`: the existing R2 account and bucket identifiers. These are needed alongside the R2 credential secrets for quantitative and verbal media.
- `FOUNDATION_ASSET_BASE_URL` is optional: use it only for a verified public CDN base. Without it, production streams quantitative videos from private R2 at their existing `/foundation/quantitative/...mp4` URLs, including HEAD and byte-range requests. No public bucket or signed URL in the frontend is required.

Student data and hosted media are not copied by a Git push. Their availability depends on using the same intended database and persistent-media settings in Render.

## Media checkout blocker

The former checkout contained about 57 GB of materialized Git LFS assets. Large video binaries are now excluded from the current Git tree and Docker context after verifying all 56 quantitative videos against R2 size/hash metadata and checking all 27 verbal video/book files. Local originals and existing Git history are retained. Required PDFs and question images remain in Git.

Run `node scripts/verify-render-media.mjs` in the original workspace to repeat read-only media verification before future packaging changes. The script requires local originals and the existing R2 environment and performs no uploads. Excluding files in `.dockerignore` alone does not fix an oversized Git checkout. Remaining PDF LFS objects still require GitHub LFS availability; do not select an older heavy-media commit for deployment.

## Verify the actual release

After deploying, confirm Render built the intended latest `main` commit and the repository-root Dockerfile. Check the logs for successful MongoDB startup, then verify sign-in, the dashboard's «نتائجي» link, saved report details, and older-results loading. Ensure paid training stays locked after an expired trial even though owned results remain readable.

A GitHub push is not proof that Render deployed successfully. Automatic deployment depends on the service's settings.
