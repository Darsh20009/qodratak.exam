# Adjust NODE_VERSION to meet Vite requirements (20.19+ or 22.12+)
ARG NODE_VERSION=22.12.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ENV PORT="5000"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# npm 10.9.0 can terminate unexpectedly during large Docker installs with
# "Exit handler never called". Pin the patched npm release before ci so the
# lockfile install stays deterministic and does not depend on the base image's
# bundled npm patch level.
COPY package-lock.json package.json ./
RUN npm install --global npm@10.9.2 --no-audit --no-fund && \
    npm ci --include=dev --prefer-offline --no-audit --no-fund

# Copy application code
COPY . .

# Build application with optimizations
RUN npm run build

# Final stage for app image
FROM base

# Copy built application and node_modules
COPY --from=build /app /app

# Expose port
EXPOSE 5000

# Start the server
CMD [ "npm", "run", "start" ]
