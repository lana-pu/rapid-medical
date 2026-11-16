# Production-ish image for running the site + admin locally or on any Docker host.
#   docker compose up            → Postgres + app on http://localhost:3000
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
# not as root (security check 2026-11-13, L.1): the image's own «node» user owns the app, so the server can still write
# its cache (.next) and uploads (public/uploads — on a Linux host the mounted folder must be writable by uid 1000)
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/.next ./.next
COPY --chown=node:node --from=build /app/public ./public
COPY --chown=node:node --from=build /app/package.json /app/package-lock.json /app/next.config.ts /app/tsconfig.json /app/drizzle.config.ts ./
COPY --chown=node:node --from=build /app/src ./src
COPY --chown=node:node --from=build /app/scripts ./scripts
COPY --chown=node:node --from=build /app/drizzle ./drizzle
COPY --chown=node:node --from=build /app/content/seed ./content/seed
USER node
EXPOSE 3000
# migrate + seed on first run, then serve
CMD ["sh", "-c", "npx tsx scripts/bootstrap.ts && npx next start -p 3000"]
