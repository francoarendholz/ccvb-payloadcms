# Projektplan & Übergabe: Neue CCVB-Website

> Stand: 08.10.2026 · Branch `feat/cms-grundgeruest` (noch nicht nach `main` gemergt)
> Dieses Dokument ist die Übergabe für neue Arbeitssitzungen. Es beschreibt Ziel,
> getroffene Entscheidungen, den erreichten Stand, die offenen Schritte und die
> Stolperfallen, die bereits aufgetreten sind.

## 1. Ziel

Die Website des Cheerleading- und Cheerperformance-Verbands Berlin (heute WordPress,
cheersportberlin.de) wird **barrierefrei (WCAG 2.2 AA / BITV 2.0)** neu gebaut. Optisch
orientiert sie sich am Bundesverband **cheersport.de** (CCVD). Mitarbeitende pflegen
Seiten, Aktuelles, Termine und Downloads möglichst einfach und ohne administrativen
Overhead.

Hauptbereiche (wie bei CCVD und der aktuellen Seite): **Verband, Jugend, Wettkämpfe,
Bildung, Leistungssport, Vielfalt**.

## 2. Getroffene Entscheidungen

| Thema | Entscheidung |
|---|---|
| Architektur | **Getrennt:** Payload 3 als reines Backend, Website mit **Astro** |
| Rendering | Website **statisch**. Beim Veröffentlichen stößt ein Webhook einen Rebuild an. Fällt das CMS aus, bleibt die Website online. |
| Frontend | **Tailwind** mit nativem HTML (`<details>`, `<dialog>`) und minimalem Vanilla-JS nach den ARIA-Mustern (APG), kein UI-Framework |
| Datenbank | PostgreSQL 17 |
| Sprachen | Deutsch (Standard), **Leichte Sprache** (Locale `ls`, HTML-`lang="de"`), Englisch |
| Redaktion | **Optionale Gegenprüfung (Vier-Augen-Prinzip).** Alle dürfen selbst veröffentlichen. Wer möchte, lässt von einem *anderen* Konto gegenlesen. |
| Rollen | `admin`, `redaktion`, `autor`. Sie unterscheiden sich nur bei Verwaltungsaufgaben: Löschen ab Redaktion; Kategorien, Navigation und Footer ab Redaktion bzw. Admin; Benutzer nur Admin. |
| Zugang CMS | Eigene Subdomain mit **verpflichtender 2FA (TOTP)**, kein VPN |
| Hosting (vorerst) | Lab auf eigenem Docker-Host `docker.fritz.box` (Portainer). TLS übernimmt der vorhandene Nginx Proxy Manager. Die Produktionsumgebung ist noch nicht entschieden: dieser Host oder ein EU-VPS. Der Stack ist in beiden Fällen gleich. |
| Entwicklung | Code lokal auf dem Mac (`pnpm dev`) gegen Postgres auf dem Lab-Host. Der Lab-Stack wird per SSH-Skript gebaut und deployt. |
| WordPress-Migration | **Offen** (Phase 8) |

## 3. Erreichter Stand

### Repo-Struktur (pnpm-Workspaces)
```
apps/cms/          Payload 3.90 (Next.js 16) – Admin + REST-API
apps/web/          (fehlt noch) Astro-Frontend
packages/shared/   AREAS, LOCALES, ROLES + generierte payload-types.ts
docker/            cms.Dockerfile, compose.lab.yml, postgres-init.sh
scripts/           deploy-lab.sh
docs/PLAN.md       dieses Dokument
```

### CMS (fertig, im Lab deployt)
- **Collections:**
  - `pages`: verschachtelt über nested-docs; Slug nur innerhalb der Elternseite eindeutig; URL aus den Breadcrumbs
  - `posts` („Aktuelles“)
  - `events` (Termine)
  - `people`: Ansprechpersonen, einmal gepflegt und auf beliebig vielen Seiten verwendet
  - `media`: Alt-Text ist Pflicht und übersetzbar, Bildgrößen als WebP
  - `documents`: PDF und Office, mit Kategorie und Bereich
  - `categories`: Typ `posts` oder `documents`
  - `users`: Rollen, API-Keys aktiviert
- **Globals:**
  - `header`: Hauptnavigation mit Unterpunkten (Mega-Menü) und Servicelinks, pro Sprache
  - `footer`: Kontakt, Links, Social Media
- **13 Layout-Blöcke** in `apps/cms/src/blocks`: Text, Bild, Bild+Text, CTA, Kachelraster, Akkordeon, Ansprechpersonen, Liste Aktuelles, Liste Termine, Liste Downloads, Galerie, Logos, Formular. Blocküberschriften werden immer als H2 ausgegeben. Der Rich Text erlaubt nur H2 bis H4, Listen und Links und kein Unterstreichen.
- **Feld „Bereich“** (`area`) an allen Inhalten, damit Bereichsseiten Inhalte automatisch zuordnen können.
- **Plugins:** SEO, Redirects, Nested Docs, Form Builder, `payload-totp`. TOTP muss das letzte Plugin bleiben.
- **Entwürfe:** Autosave, Versionen und zeitgesteuertes Veröffentlichen (`jobs.autoRun`).
- **Gegenprüfung:**
  - Code in `apps/cms/src/workflow/`
  - Dashboard-Komponente in `apps/cms/src/components/ReviewQueue.tsx`
  - E-Mail per SMTP, falls `SMTP_HOST` gesetzt ist, sonst nur Log
- **Zugriffsregeln** in `apps/cms/src/access/index.ts`:
  - Öffentliche Inhalte sind anonym lesbar.
  - Entwürfe sieht nur, wer angemeldet ist und den TOTP-Code bestätigt hat (`publishedOrVerified`).
- **Admin-Oberfläche** auf Deutsch.
- **Migrationen:** drei Stück in `apps/cms/src/migrations`. Sie laufen beim Containerstart automatisch (`prodMigrations`).

### Lab-Umgebung `docker.fritz.box` (SSH: `root@docker.fritz.box`, LAN-IP 192.168.20.203)
| Port | Dienst | Domain (NPM) | Status |
|---|---|---|---|
| 8130 | Caddy (Website, `/media`, `/preview`, `/api/form`) | ccvbastro.lab.code-ops.de | **fehlt noch** |
| 8131 | CMS | ccvbcms.lab.code-ops.de | läuft |
| 8132 | Postgres (nur LAN, DBs `ccvb_lab` + `ccvb_dev`) | – | läuft |

- Compose-Projekt `ccvb` in `/opt/ccvb`, sichtbar in Portainer.
- Secrets liegen in `.env.lab` (Repo-Root, gitignored): DB-Passwörter, `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `LAB_ADMIN_EMAIL` und `LAB_ADMIN_PASSWORD`.
- Das Lab-Admin-Konto existiert. Beim ersten Login wird die TOTP-Einrichtung erzwungen.
- Lokale Testkonten in `ccvb_dev`: `admin@`, `redaktion@`, `autor@` und `autorin@test.local`, jeweils mit dem Passwort `Test-Passwort-123!`.

### Tests
- `node apps/cms/tests/api/review-workflow.mjs` braucht einen laufenden Dev-Server mit `TOTP_DISABLED=true`. Der Test prüft 22 Fälle zu Rollen, Gegenprüfung und öffentlicher Lesbarkeit. Letzter Lauf: alle bestanden.
- `pnpm typecheck` und `pnpm lint` in `apps/cms` laufen ohne Fehler. Eine bekannte Warnung kommt aus einem Template-Test.

## 4. Offene Schritte

Reihenfolge als Vorschlag. **Offene Frage an Franco vor Phase 6:** Sollen zuerst die Design-Grundlagen nach dem Vorbild cheersport.de (Farben, Schriften, Logo) abgestimmt werden, oder soll erst Struktur und Barrierefreiheit entstehen und das Design danach angeglichen werden?

### Phase 6 und 5: Astro-Frontend mit Sprachen (als Nächstes)
1. `apps/web` anlegen:
   - Astro 5 mit `output: 'static'` und `@astrojs/node` für die SSR-Routen `/preview/*` und `/api/form`
   - Tailwind v4, Typen aus `@ccvb/shared/payload-types`
2. Datenzugriff über einen kleinen REST-Client gegen `CMS_URL`:
   - **Immer `locale=` und `fallback-locale=none` mitschicken** (siehe Stolperfallen)
   - Veröffentlichte Inhalte sind ohne Anmeldung lesbar, der Build braucht also keinen Key.
3. Rich Text mit `convertLexicalToHTML` aus `@payloadcms/richtext-lexical/html` zur Build-Zeit umwandeln. Eigene Konverter für interne Links und eingebettete Blöcke schreiben.
4. Routen:
   - `/` (Startseite = Page mit Slug `home` o. ä.)
   - verschachtelte Seiten über die Breadcrumb-URL
   - `/aktuelles` (Liste und Detail)
   - `/termine`
   - `/downloads` (Filter per GET-Formular)
   - `/suche` (Pagefind)
   - 404, Impressum, Datenschutz, **Erklärung zur Barrierefreiheit**
5. Sprachen (i18n-Routing):
   - `/` für Deutsch, `/leichte-sprache/…`, `/en/…`
   - Seiten ohne Fassung in einer Sprache werden für diese Sprache nicht erzeugt.
   - Der Sprachumschalter verlinkt nur vorhandene Fassungen.
   - Leichte Sprache bekommt ein eigenes Layout: größere Schrift, mehr Zeilenabstand.
6. Barrierefreiheit:
   - Landmarks, Skip-Link, eine H1 pro Seite, sichtbarer Fokus, Kontrast ≥ 4,5:1
   - `prefers-reduced-motion`, kein Autoplay, Reflow bei 320 px
   - Mega-Menü als Disclosure-Pattern, das ohne JS als normale Linkliste funktioniert
   - YouTube und Instagram mit 2-Klick-Lösung
   - Schriften selbst gehostet
7. Bilder über `<picture>` mit den Payload-Bildgrößen. `/media` liefert Caddy direkt aus dem Media-Volume aus.
8. Formulare:
   - Ein Astro-Endpunkt `POST /api/form` validiert die Eingaben, nutzt Honeypot und Rate-Limit und leitet an `form-submissions` weiter.
   - Ohne JS gibt es eine normale Weiterleitung auf eine Danke-Seite.
9. Tests mit Playwright und `@axe-core/playwright` für jeden Seitentyp.

### Phase 4: Rebuild-Pipeline, Vorschau und Caddy (Port 8130)
1. **Rebuild-Hook im CMS** (`afterChange`/`afterDelete` auf Pages, Posts, Events, People, Documents, Media, Categories, Header, Footer, Redirects):
   - POST an `http://web:4321/internal/rebuild` mit `REBUILD_TOKEN`
   - nur bei Änderungen am veröffentlichten Stand, nicht bei Autosaves (`req.query.draft`/`autosave` beachten, siehe Stolperfallen)
2. **Builder im `web`-Container:**
   - bündelt Anfragen (etwa 15 s Ruhezeit, nie zwei Builds parallel)
   - führt `astro build` und danach `pagefind` aus
   - wechselt atomar per Symlink `www/current`
   - behält drei Builds für ein Rollback
   - erzeugt die Weiterleitungsdatei für Caddy aus `redirects`
3. **Dashboard-Hinweis** im CMS: „Website wird aktualisiert / zuletzt aktualisiert um …“
4. **Vorschau:**
   - Die `previewUrl` (`apps/cms/src/utilities/previewUrl.ts`) zeigt bereits auf `WEB_URL/preview/<collection>/<id>?token=PREVIEW_SECRET&locale=…`.
   - Die SSR-Route prüft den Token und holt Entwürfe mit einem **API-Key eines Dienstkontos**. API-Keys umgehen TOTP, das Konto braucht also nur Leserechte.
   - Ausgabe mit `noindex`.
5. **Compose ergänzen:**
   - Services `web` (Node 22, Astro-Quellcode) und `caddy` (Port 8130)
   - Volumes `www` und `media` (read-only in Caddy)
   - `X-Robots-Tag: noindex` auf beiden Lab-Domains
6. Ausfalltest: `docker compose stop cms`. Website, Suche und Downloads funktionieren weiter.

### Phase 7: Restlicher Betrieb
- Nächtliches `pg_dump` plus Medien-Backup per `restic`, mit dokumentiertem Restore-Test
- CI mit GitHub Actions:
  - lint, typecheck, Build und axe-Tests
  - amd64-Images nach Harbor (läuft auf dem Lab-Host) oder GHCR
- Uptime-Monitoring und Benachrichtigung bei fehlgeschlagenem Rebuild
- SMTP für Workflow-Mails in `.env.lab` eintragen (`SMTP_*`, im Compose bereits durchgereicht)
- Rate-Limit für den Login im Nginx Proxy Manager
- Entscheidung Produktion: dieser Host oder EU-VPS. Dazu eigene Domains `www.` und `cms.`

### Phase 8: Inhalte und Migration (Entscheidung offen)
- **Option Import:** `apps/cms/scripts/import-wordpress.ts` liest die WP-REST-API (`/wp-json/wp/v2/…`) und schreibt über die Local API (HTML → Lexical).
- **Option manuell:** Die Inhalte werden von Hand eingepflegt.
- **In beiden Fällen:** Weiterleitungen der alten URLs über das Redirects-Plugin.

### Kleinere offene Punkte
- **Seiten-Slug:** Er ist mit `disableUnique` angelegt, und es gibt noch **keine Prüfung auf doppelte Slugs unter derselben Elternseite**. Dafür einen Validator oder Hook ergänzen.
- **Slug bei API-Anlage:** Wird ein Dokument per API ohne `slug` angelegt, kommt „Slug Pflichtfeld“, weil der Slug nur im Admin automatisch erzeugt wird. Für das Import-Skript relevant.
- **Barrierefreiheit im Admin:** Die sechs Code-Felder von `payload-totp` haben keine Beschriftung für Screenreader. Upstream-Issue oder PR beim Plugin anregen.
- **Formular-Eingänge:** Im Dashboard steht ein „+“, man könnte sie also manuell anlegen. Kosmetisch, `admin.hidden`/create-UI prüfen.
- **Admin-Komfort:** RowLabels für Arrays (Navigation, Kacheln) und eine Admin-Beschreibung für die Startseite.
- **Testskript:** `tests/api/review-workflow.mjs` in Vitest bzw. die CI überführen.
- **Branch:** `feat/cms-grundgeruest` per PR nach `main` bringen. Der GitHub-MCP war in der ersten Sitzung nicht verbunden, `gh` funktioniert.

## 5. Stolperfallen (bereits aufgetreten, unbedingt beachten)

1. **`localization.fallback` muss `true` sein.** Mit `false` landen Anfragen ohne `?locale=` im „alle Sprachen“-Modus. Speichern stürzt dann ab: `invalid input value for enum _locales: "root"`. Dass keine stille Ersatzsprache angezeigt wird, regelt das Frontend über `fallback-locale=none`.
2. **Keine übersetzten Felder innerhalb übersetzter Felder.** Es werden nur Container lokalisiert: `layout`, Rich Text, Titel, `hero`-Gruppe und die Navigations-Arrays. Felder innerhalb von Blöcken haben kein `localized`.
3. **Import-Map immer mit aktivem TOTP erzeugen.** Das Skript `pnpm generate:importmap` setzt `TOTP_DISABLED=false` bereits selbst. Sonst fehlen die Plugin-Komponenten, und der Admin bleibt weiß.
4. **`payload-totp` sperrt standardmäßig alle anonymen Zugriffe.** Öffentlich lesbare Collections und Globals brauchen `custom: publicRead` (aus `@/access`). Anonym anlegbare Collections (Formular-Eingänge) brauchen `custom.totp.disableAccessWrapper.create`. Das gilt auch für jede neue Collection, die öffentlich sein soll.
5. **Payload überspringt Feldvalidierungen bei Entwürfen.** Workflow-Regeln deshalb in `beforeChange`-Hooks prüfen, nicht in `validate`.
6. **Query-Parameter wie `draft` und `autosave` kommen je nach Aufrufer als String oder Boolean** an. Deshalb mit `String(req.query?.draft) === 'true'` vergleichen.
7. **`originalDoc` im Hook ist bei vorhandenem Entwurf die Entwurfsfassung**, nicht die Live-Fassung. Den Live-Status bei Bedarf per `findByID({ draft: false })` holen.
8. **Dev-Server hängt bei Schema-Änderungen mit Datenverlust**, zum Beispiel bei umbenannten Enum-Werten. Payload fragt dann interaktiv nach. Lösung: den Dev-Server im echten Terminal starten und bestätigen, oder das Schema von `ccvb_dev` zurücksetzen (nur Testdaten). Für das Lab **immer** `pnpm payload migrate:create <name>` ausführen und die erzeugte SQL prüfen: Enum-Umbauten brauchen ein `UPDATE` alter Werte (Beispiel in `20261008_155025_optional_review.ts`).
9. **Sichere Cookies im Lab:** Login nur über `https://ccvbcms.lab.code-ops.de`, nicht über `http://192.168.20.203:8131`.
10. **Das macOS-`rsync` kennt kein `--chmod`.** Das Deploy-Skript nutzt deshalb `scp` und `chmod`.
11. **Der Playwright-MCP schreibt nach `.playwright-mcp/`** im Repo. Der Ordner ist gitignored.
12. **Auto-Mode-Sicherheitsprüfung:** Sie hat zwei Aktionen blockiert:
    - den Aufruf der Portainer-API mit dem Token aus `.env`. Für das Deployment wird stattdessen SSH genutzt.
    - einen Dev-Server-Neustart direkt nach dem Zurücksetzen der Dev-Datenbank. Vorher nachfragen.

## 6. Befehle

```bash
# lokal
pnpm install
pnpm dev                                   # CMS: http://localhost:3000/admin
cd apps/cms
pnpm generate:types                        # → packages/shared/src/payload-types.ts
pnpm generate:importmap                    # nach neuen Admin-Komponenten
pnpm payload migrate:create <name>         # nach Schema-Änderungen (für das Lab)
pnpm typecheck && pnpm lint
node tests/api/review-workflow.mjs         # Workflow-Test (Dev-Server mit TOTP_DISABLED=true)

# Lab
./scripts/deploy-lab.sh            # kompletter Stack
./scripts/deploy-lab.sh cms        # nur CMS (Build auf dem Server, ca. 2 min)
ssh root@docker.fritz.box 'docker logs ccvb-cms-1 --tail 50'
```
