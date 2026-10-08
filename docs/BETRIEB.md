# Betrieb: Backup, Wiederherstellung, Monitoring

Stand: 08.10.2026 · gilt für den Lab-Stack auf `docker.fritz.box` (`/opt/ccvb`).
Alle Befehle auf dem Host im Verzeichnis `/opt/ccvb`. Abkürzung:

```bash
DC="docker compose --env-file .env.lab -f docker/compose.lab.yml"
```

## Backup

| | |
|---|---|
| Was | Datenbank `ccvb_lab` (`pg_dump`, Custom-Format) und das Media-Volume (Bilder, Dokumente) |
| Nicht gesichert | Website-Builds (`www`) – entstehen jederzeit neu aus dem CMS; Caddy-Daten |
| Wohin | restic-Repository `/opt/backups/ccvb/repo` auf dem Host (verschlüsselt, dedupliziert) |
| Wann | täglich 02:30 (Container `backup`, Variable `BACKUP_TIME`), vor dem nächtlichen Website-Neubau um 03:00 |
| Aufbewahrung | 7 tägliche, 4 wöchentliche, 6 monatliche Stände |
| Prüfung | sonntags nach dem Backup: `restic check` + **automatischer Restore-Test** (s. u.) |
| Meldung | Erfolg/Fehler an Uptime Kuma (Push-Monitor, `MONITOR_PUSH_URL_BACKUP` in `.env.lab`) |

> **Wichtig:** Das restic-Passwort steht nur in `.env.lab` (`RESTIC_PASSWORD`). Ohne Passwort sind
> die Backups wertlos. Es gehört zusätzlich in den Passwortmanager.
>
> Die Backups liegen auf derselben Platte wie die Daten (Entscheidung 08.10.: lokal auf dem Host).
> Gegen Plattenausfall schützt das nicht – für die Produktion eine Kopie außer Haus einplanen
> (z. B. `restic copy` auf das NAS oder einen EU-Speicher).

### Von Hand

```bash
$DC exec backup backup.sh                     # Backup sofort
$DC exec backup restore-test.sh               # Restore-Test sofort
$DC exec backup restic snapshots              # Stände anzeigen
$DC logs backup --tail 50                     # letzte Läufe
```

### Automatischer Restore-Test (wöchentlich)

`docker/backup/restore-test.sh`:
1. `restic check` – Integrität des Repositories
2. neuesten Stand nach `/tmp/restore` im Container wiederherstellen
3. Dump in eine Wegwerf-Datenbank `ccvb_restore_test` einspielen, Zeilenzahlen von `pages`,
   `posts`, `events`, `media`, `documents`, `users` mit der Live-Datenbank vergleichen, Datenbank löschen
4. Anzahl der Mediendateien im Stand mit dem Volume vergleichen

Erstmals erfolgreich: 08.10.2026 lokal (Docker, Beispielinhalte) und im Lab.

## Wiederherstellung im Ernstfall

Beispiel: Datenbank und Medien auf den neuesten Stand des Backups zurücksetzen.
Statt `latest` geht jede ID aus `restic snapshots`.

```bash
# 1. Stand auspacken (/restore im Container = /opt/backups/ccvb/restore auf dem Host)
$DC exec backup restic restore latest --tag ccvb --target /restore
#    → /opt/backups/ccvb/restore/tmp/staging/db/ccvb_lab.dump und …/restore/data/media

# 2. Schreibende Dienste stoppen (Caddy liefert die Website weiter aus)
$DC stop cms web

# 3. Datenbank ersetzen
$DC exec postgres dropdb -U postgres ccvb_lab
$DC exec postgres createdb -U postgres -O ccvb_lab ccvb_lab
docker cp /opt/backups/ccvb/restore/tmp/staging/db/ccvb_lab.dump ccvb-postgres-1:/tmp/restore.dump
$DC exec postgres pg_restore -U ccvb_lab -d ccvb_lab --no-owner /tmp/restore.dump
$DC exec postgres rm /tmp/restore.dump

# 4. Medien ersetzen (Volume ccvb_media, Eigentümer ist der CMS-Benutzer 1001)
docker run --rm -v ccvb_media:/data/media -v /opt/backups/ccvb/restore/data/media:/src:ro alpine \
  sh -c 'rm -rf /data/media/* && cp -a /src/. /data/media/ && chown -R 1001:1001 /data/media'

# 5. Starten – das CMS führt ggf. fehlende Migrationen aus, der Builder baut die Website neu
$DC start cms web
rm -rf /opt/backups/ccvb/restore/*
```

Nach Schritt 5: im CMS anmelden, Stichproben prüfen, im Dashboard „Website zuletzt aktualisiert“ abwarten.

## Monitoring (Uptime Kuma)

Uptime Kuma ist ein **eigenständiger Dienst für den ganzen Host**, nicht Teil dieses Projekts:

| | |
|---|---|
| Ort | `/opt/uptime-kuma/compose.yml` (Projekt `uptime-kuma`, in Portainer sichtbar) |
| Oberfläche | http://192.168.20.203:8140 (Domain/TLS bei Bedarf über den Nginx Proxy Manager) |
| Docker-Monitore | Docker-Host `http://docker-proxy:2375` (Socket-Proxy, nur lesend: Container-Infos) |

Ein Ausfall des Hosts selbst fällt so nicht auf – dafür bräuchte es eine Prüfung von außen.

### Monitore für CCVB

| Monitor | Typ | Ziel / Einstellung |
|---|---|---|
| CCVB Website | HTTP(s) – Keyword | `https://ccvbastro.lab.code-ops.de/`, Keyword `CCVB` |
| CCVB CMS | HTTP(s) | `https://ccvbcms.lab.code-ops.de/api/globals/header` (200 erwartet) |
| CCVB Container | Docker-Container | `ccvb-cms-1`, `ccvb-web-1`, `ccvb-caddy-1`, `ccvb-postgres-1`, `ccvb-backup-1` |
| CCVB Website-Build | Push | Heartbeat-Intervall **90000 s** (25 h): Der Builder meldet jedes Ergebnis, mindestens den nächtlichen Build. Push-URL → `.env.lab` als `MONITOR_PUSH_URL_BUILD` |
| CCVB Backup | Push | Heartbeat-Intervall **90000 s**. Push-URL → `.env.lab` als `MONITOR_PUSH_URL_BACKUP` |

Push-URLs von Kuma enthalten `localhost` – im Lab durch `http://192.168.20.203:8140` ersetzen
(die Container erreichen Kuma über die LAN-IP). Nach dem Eintragen: `./scripts/deploy-lab.sh web backup`.

Benachrichtigungen: in Kuma unter Einstellungen → Benachrichtigungen (E-Mail, sobald SMTP da ist,
oder z. B. ntfy/Telegram/Pushover).
