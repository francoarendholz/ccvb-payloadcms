#!/bin/sh
# Restore-Test: neuesten Snapshot wiederherstellen, Dump in eine Wegwerf-Datenbank einspielen
# und mit der Live-Datenbank vergleichen; Medien auf Vollständigkeit prüfen.
# Braucht zusätzlich POSTGRES_PASSWORD (Superuser, nur für CREATE/DROP DATABASE).
set -eu
TARGET=/tmp/restore
TESTDB=ccvb_restore_test

push() {
  [ -n "${MONITOR_PUSH_URL:-}" ] || return 0
  curl -fsS -m 10 -G "$MONITOR_PUSH_URL" --data-urlencode "status=$1" --data-urlencode "msg=$2" >/dev/null || true
}
fail() {
  echo "$(date -Iseconds) Restore-Test FEHLGESCHLAGEN: $1" >&2
  push down "Restore-Test fehlgeschlagen: $1"
  PGPASSWORD="$POSTGRES_PASSWORD" dropdb -U postgres --if-exists "$TESTDB" 2>/dev/null || true
  rm -rf "$TARGET"
  exit 1
}

echo "$(date -Iseconds) Restore-Test startet"
restic check --quiet || fail "restic check"

rm -rf "$TARGET"
restic restore latest --tag ccvb --target "$TARGET" --quiet || fail "restic restore"
dump="$TARGET/tmp/staging/db/$PGDATABASE.dump"
[ -s "$dump" ] || fail "Dump fehlt im Snapshot"

# Superuser-Aufruf: Optionen vor den Argumenten (musl-getopt sortiert nicht um)
as_superuser() { cmd=$1; shift; PGPASSWORD="$POSTGRES_PASSWORD" "$cmd" -U postgres "$@"; }
as_superuser dropdb --if-exists "$TESTDB"
as_superuser createdb "$TESTDB" || fail "createdb"
as_superuser pg_restore --no-owner --dbname="$TESTDB" "$dump" || fail "pg_restore"

# Zeilenzahlen der wichtigsten Tabellen vergleichen (Live kann seit dem Backup gewachsen sein)
for table in pages posts events media documents users; do
  restored=$(as_superuser psql -d "$TESTDB" -tAc "select count(*) from $table") || fail "Tabelle $table fehlt"
  live=$(psql -tAc "select count(*) from $table")
  echo "  $table: wiederhergestellt $restored, live $live"
  [ "$restored" -gt 0 ] || [ "$live" -eq 0 ] || fail "Tabelle $table leer"
done
as_superuser dropdb "$TESTDB"

# Medien: Anzahl der Dateien im Snapshot gegen das Volume
restored_files=$(find "$TARGET/data/media" -type f | wc -l)
live_files=$(find /data/media -type f | wc -l)
echo "  Mediendateien: wiederhergestellt $restored_files, live $live_files"
[ "$restored_files" -gt 0 ] || [ "$live_files" -eq 0 ] || fail "keine Mediendateien im Snapshot"
rm -rf "$TARGET"

echo "$(date -Iseconds) Restore-Test erfolgreich"
push up "Restore-Test ok"
