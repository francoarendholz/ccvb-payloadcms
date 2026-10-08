# Payload CMS (Next.js standalone) – Build-Kontext ist das Repo-Root.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cms/package.json apps/cms/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @ccvb/cms...

# Werkzeuge (Seed, später Import): Quellcode + Abhängigkeiten, ohne Next-Build.
# Aufruf über den Compose-Service „cms-tools“ (Profil tools).
FROM deps AS tools
COPY packages/shared packages/shared
COPY apps/cms apps/cms
WORKDIR /app/apps/cms
ENV NODE_ENV=production NODE_OPTIONS=--no-deprecation HOME=/tmp
USER 1001
ENTRYPOINT ["node_modules/.bin/payload"]

FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/cms apps/cms
ENV NEXT_TELEMETRY_DISABLED=1
# Secret wird nur zum Bauen benötigt, zur Laufzeit kommt das echte aus der Umgebung.
RUN PAYLOAD_SECRET=build-only DATABASE_URL=postgresql://build:build@localhost/build \
    pnpm --filter @ccvb/cms build

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs payload \
    && mkdir -p /data/media && chown -R payload:nodejs /data
COPY --from=builder --chown=payload:nodejs /app/apps/cms/.next/standalone ./
COPY --from=builder --chown=payload:nodejs /app/apps/cms/.next/static ./apps/cms/.next/static
USER payload
EXPOSE 3000
CMD ["node", "apps/cms/server.js"]
