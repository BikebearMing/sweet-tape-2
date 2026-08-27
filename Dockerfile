# syntax=docker/dockerfile:1

# Debian slim, not Alpine. sharp links against libvips and its prebuilt
# binaries target glibc; on Alpine's musl you get an install that succeeds and
# a container that crashes the first time Payload processes an upload.
ARG NODE_VERSION=22-bookworm-slim


# --- deps -------------------------------------------------------------------
# Split from the build so a source-only change reuses this layer. package.json
# and the lockfile are the only inputs, so npm ci reruns only when they move.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# --- builder ----------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No DATABASE_URI and no PAYLOAD_SECRET here on purpose. The Postgres adapter
# is lazy and the config falls back to a dev secret, so the build compiles the
# admin routes without ever opening a connection. Real values arrive at runtime
# from Dokploy — baking either into an image layer would leak them to anyone
# who can pull it.
RUN npm run build


# --- runner -----------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    MEDIA_DIR=/app/media

# The traced server: standalone bundles only what the app actually imports,
# and writes its own minimal node_modules. It deliberately excludes these two,
# so they get copied in separately or the site loads with no CSS and no art.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Payload's upload target. Mounting a volume here is what makes uploads
# outlive a redeploy — without it this is just a folder inside a container
# that gets thrown away. Created and owned up front because a volume mounted
# over a missing directory inherits root and Payload then can't write to it.
RUN mkdir -p /app/media && chown node:node /app/media
VOLUME /app/media

# Drop root. Nothing here needs it, and a Next process that can't write to its
# own application files is one less thing an exploit can pivot through.
USER node

EXPOSE 3000
CMD ["node", "server.js"]
