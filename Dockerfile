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

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Keep the lockfile install deterministic. Node 20 LTS ships a stable npm
# release for this Docker build environment.
COPY package-lock.json package.json ./
RUN npm ci --include=dev --prefer-offline --no-audit --no-fund

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
