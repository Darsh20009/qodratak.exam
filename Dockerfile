# Render builds the current Qodratak monorepo from the repository root.
ARG NODE_VERSION=20.19.5
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV BASE_PATH=/

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      pkg-config \
      python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig*.json ./
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/
COPY scripts/ ./scripts/
COPY attached_assets/ ./attached_assets/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/qodratak run build
RUN pnpm --filter @workspace/api-server run build

FROM base AS runtime

COPY --from=build /app /app

EXPOSE 5000
CMD ["node", "artifacts/api-server/start.mjs"]