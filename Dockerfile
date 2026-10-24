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

RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm --filter @workspace/qodratak run build
RUN PORT=21742 BASE_PATH=/qodratak-guide/ pnpm --filter @workspace/qodratak-guide run build
RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/api-server deploy --prod --legacy /tmp/api-runtime

FROM base AS runtime

WORKDIR /app

# Keep only production dependencies in the runtime image. The full workspace
# node_modules remains in the build stage for Vite, TypeScript, and esbuild.
COPY --from=build /tmp/api-runtime/node_modules/ /app/node_modules/

# Preserve root-relative attachment paths consumed by API routes.
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/attached_assets/ /app/attached_assets/

# The bundled API only needs its built JavaScript, private assets, and runtime
# data. Source files, tests, scripts, and source maps stay in the build stage.
COPY --from=build /app/artifacts/api-server/start.mjs /app/artifacts/api-server/start.mjs
COPY --from=build /app/artifacts/api-server/dist/*.mjs /app/artifacts/api-server/dist/
COPY --from=build /app/artifacts/api-server/dist/private-assets/ /app/artifacts/api-server/dist/private-assets/
COPY --from=build /app/artifacts/api-server/private-assets/ /app/artifacts/api-server/private-assets/
COPY --from=build /app/artifacts/api-server/attached_assets/ /app/artifacts/api-server/attached_assets/
COPY --from=build /app/artifacts/api-server/server/data/ /app/artifacts/api-server/server/data/

# Express serves these generated directories directly in production.
COPY --from=build /app/artifacts/qodratak/dist/public/ /app/artifacts/qodratak/dist/public/
COPY --from=build /app/artifacts/qodratak-guide/dist/public/ /app/artifacts/qodratak-guide/dist/public/

EXPOSE 5000
CMD ["node", "artifacts/api-server/start.mjs"]