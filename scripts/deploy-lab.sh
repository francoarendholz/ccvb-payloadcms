#!/usr/bin/env bash
# Synchronisiert das Repo nach docker.fritz.box und (re)startet den Lab-Stack.
# Aufruf: ./scripts/deploy-lab.sh [service ...]
set -euo pipefail

HOST="${LAB_HOST:-root@docker.fritz.box}"
DIR="/opt/ccvb"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

[[ -f "$ROOT/.env.lab" ]] || { echo ".env.lab fehlt" >&2; exit 1; }

rsync -az --delete \
  --exclude node_modules --exclude .git --exclude '.env*' \
  --exclude dist --exclude .next --exclude .astro --exclude test-results --exclude 'apps/cms/media' \
  "$ROOT/" "$HOST:$DIR/"
scp -q "$ROOT/.env.lab" "$HOST:$DIR/.env.lab"
ssh "$HOST" "chmod 600 $DIR/.env.lab"

COMPOSE="docker compose --env-file .env.lab -f docker/compose.lab.yml"
ssh "$HOST" "cd $DIR && $COMPOSE up -d --build --quiet-pull --remove-orphans $* && $COMPOSE ps"
