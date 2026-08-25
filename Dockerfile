# Vite 7 requires Node 20.19+; Node 20 LTS avoids the npm Docker crash
# observed with the Node 22 image on the deployment builder.
ARG NODE_VERSION=20.19.5
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ENV PORT="5000"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install native build tools without Debian's node-gyp package.
# The Debian node-gyp package pulls Node 18 into the Node 20 image and caused
# npm ci to fail with "Exit handler never called" on the Render builder.
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Keep the lockfile install deterministic. Node 20 LTS ships a stable npm
# release for this Docker build environment.
COPY package-lock.json package.json ./
RUN npm ci --include=dev --no-audit --no-fund
RUN test -x node_modules/.bin/vite

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
