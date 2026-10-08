#!/bin/sh
# Sichert die Datenbank (pg_dump) und das Media-Volume in das restic-Repository.
# Umgebung: RESTIC_REPOSITORY, RESTIC_PASSWORD, PGHOST, PGUSER, PGPASSWORD, PGDATABASE,
#           optional MONITOR_PUSH_URL (Uptime-Kuma-Push)
set -eu
STAGING=/tmp/staging

push() {
  [ -n "${MONITOR_PUSH_URL:-}" ] || return 0
  curl -fsS -m 10 -G "$MONITOR_PUSH_URL" --data-urlencode "status=$1" --data-urlencode "msg=$2" >/dev/null || true
}
fail() {
  echo "$(date -Iseconds) Backup FEHLGESCHLAGEN: $1" >&2
  push down "Backup fehlgeschlagen: $1"
  exit 1
}

echo "$(date -Iseconds) Backup startet"
start=$(date +%s)
rm -rf "$STAGING" && mkdir -p "$STAGING/db"

pg_dump --format=custom --file="$STAGING/db/$PGDATABASE.dump" || fail "pg_dump"

restic cat config >/dev/null 2>&1 || restic init || fail "Repository nicht lesbar (Passwort?) und Neuanlage nicht möglich"
restic backup --quiet --tag ccvb --host ccvb "$STAGING/db" /data/media || fail "restic backup"
restic forget --quiet --tag ccvb --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune || fail "restic forget"
rm -rf "$STAGING"

duration=$(( $(date +%s) - start ))
summary=$(restic snapshots --tag ccvb --latest 1 --compact | tail -3 | head -1)
echo "$(date -Iseconds) Backup fertig in ${duration} s: $summary"
push up "Backup ok (${duration} s)"
