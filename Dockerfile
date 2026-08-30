# Render builds the legacy full-stack Qodratak service from the repository root.
# The application source is kept in .migration-backup for compatibility with
# the existing Express + Vite deployment.
ARG NODE_VERSION=20.19.5
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      pkg-config \
      python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

COPY .migration-backup/package.json .migration-backup/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY .migration-backup/ ./
RUN pnpm rebuild sharp
RUN pnpm run build

FROM base AS runtime

COPY --from=build /app /app

EXPOSE 5000
CMD ["node", "dist/index.js"]