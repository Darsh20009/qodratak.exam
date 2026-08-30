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