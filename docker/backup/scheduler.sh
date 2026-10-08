#!/bin/sh
# Einfacher Zeitplan ohne cron (cron gibt die Container-Umgebung nicht an Jobs weiter).
# Täglich um BACKUP_TIME (Standard 02:30) ein Backup, sonntags danach Prüfung + Restore-Test.
set -u
BACKUP_TIME="${BACKUP_TIME:-02:30}"

echo "$(date -Iseconds) Backup-Planer aktiv, täglich um $BACKUP_TIME"
while true; do
  now=$(date +%s)
  next=$(date -d "$(date +%Y-%m-%d) $BACKUP_TIME" +%s)
  [ "$next" -le "$now" ] && next=$((next + 86400))
  sleep $((next - now))
  backup.sh
  if [ "$(date +%u)" = 7 ]; then restore-test.sh; fi
done
