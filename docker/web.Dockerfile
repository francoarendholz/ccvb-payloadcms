# Website: Astro-Quellcode + Builder. Gebaut wird erst zur Laufzeit (braucht das CMS),
# die fertigen Fassungen liegen im Volume /data/www und werden von Caddy ausgeliefert.
FROM node:22-alpine
RUN apk add --no-cache tzdata && corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @ccvb/web...

COPY packages/shared packages/shared
COPY apps/web apps/web

ENV NODE_ENV=production TZ=Europe/Berlin ASTRO_TELEMETRY_DISABLED=1 WWW_DIR=/data/www
# Astro legt beim Build Cache-Dateien im Projekt ab.
RUN mkdir -p /data/www && chown -R node:node /data /app/apps/web
USER node
EXPOSE 4321 4322
CMD ["node", "apps/web/scripts/builder.mjs"]
