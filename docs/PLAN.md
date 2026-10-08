# Projektplan & Übergabe: Neue CCVB-Website

> Stand: 08.10.2026 (abends) · Branch `main`
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
| Rollen | `admin`, `redaktion`, `autor` (+ Dienstkonto-Rolle `vorschau`, nur lesen). Sie unterscheiden sich nur bei Verwaltungsaufgaben: Löschen ab Redaktion; Kategorien, Navigation und Footer ab Redaktion bzw. Admin; Benutzer nur Admin. |
| Zugang CMS | Eigene Subdomain mit **verpflichtender 2FA (TOTP)**, kein VPN |
| Hosting (vorerst) | Lab auf eigenem Docker-Host `docker.fritz.box` (Portainer). TLS übernimmt der vorhandene Nginx Proxy Manager. Die Produktionsumgebung ist noch nicht entschieden: dieser Host oder ein EU-VPS. Der Stack ist in beiden Fällen gleich. |
| Entwicklung | Code lokal auf dem Mac (`pnpm dev`) gegen Postgres auf dem Lab-Host. Der Lab-Stack wird per SSH-Skript gebaut und deployt. |
| Design | **Struktur zuerst** (Franco, 08.10.): Design-Tokens zentral in `apps/web/src/styles/global.css`, vorläufig Rot aus dem CCVB-Logo + Roboto wie cheersport.de. Logo vorläufig von cheersportberlin.de (PNG, 270 px – SVG-Original besorgen). |
| WordPress-Migration | **Offen** (Phase 8) |

## 3. Erreichter Stand

### Repo-Struktur (pnpm-Workspaces)
```
apps/cms/          Payload 3.90 (Next.js 16) – Admin + REST-API
apps/web/          Astro 7 – statische Website + Node-Server für /api/form (und später /preview)
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
- **Migrationen:** vier Stück in `apps/cms/src/migrations`. Sie laufen beim Containerstart automatisch (`prodMigrations`).
- **Typen:** `payload-types.ts` wird mit `typescript.declare: false` erzeugt, damit das Frontend sie ohne Payload nutzen kann. Die Modul-Erweiterung für die Local API steht in `apps/cms/src/payload-generated.d.ts`.
- **Beispielinhalte:** `pnpm seed` (in `apps/cms`) legt Seiten, Beiträge, Termine, Personen, Dokumente, Formular, Navigation und Footer in allen drei Sprachen an. `--force` löscht vorher. In `ccvb_dev` ist das bereits passiert.

### Rebuild-Pipeline und Vorschau (Phase 4 – lokal mit Docker getestet)
- **Auslöser im CMS:** `src/hooks/triggerRebuild.ts`, zentral per `rebuildPlugin` in `src/plugins.ts` an Pages, Posts, Events, People, Media, Documents, Categories, Redirects, Forms und an beide Globals gehängt. Nur Änderungen am veröffentlichten Stand (Veröffentlichen, Ändern der Live-Fassung, Zurückziehen, Löschen), keine Entwürfe/Autosaves. Ohne `REBUILD_URL` passiert nichts.
- **Builder** `apps/web/scripts/builder.mjs` (Web-Container, Port 4321 intern): bündelt Anfragen (15 s Ruhe, spätestens nach 2 min), nie parallel, Build nach `/data/www/builds/<zeit>`, Symlink `current` atomar, drei Fassungen bleiben, nächtlicher Neubau um 3 Uhr (Container mit `TZ=Europe/Berlin`). Schlägt ein Build fehl, bleibt die alte Fassung online. Rollback: `cd /data/www && ln -sfn builds/<zeit> current`. Startet außerdem den Astro-Node-Server (Port 4322) für `/api/form` und `/preview`.
- **Weiterleitungen:** Astro erzeugt `redirects.json` aus dem Redirects-Plugin. Findet Caddy keine Datei, fragt es den Builder: 301/302 oder 404-Seite. Kein Caddy-Reload nötig.
- **Dashboard:** `components/RebuildStatus.tsx` zeigt „wird aktualisiert / zuletzt aktualisiert / fehlgeschlagen“.
- **Vorschau:** `apps/web/src/pages/preview/[collection]/[id].astro` prüft `PREVIEW_SECRET`, lädt den Entwurf mit dem API-Key des Dienstkontos. Live-Vorschau: meldet sich bei Payload bereit und lädt nach jedem Speichern neu.
- **Dienstkonto:** wird beim CMS-Start aus `PREVIEW_API_KEY` angelegt/aktualisiert (`src/utilities/serviceAccount.ts`, E-Mail `vorschau@dienstkonto.invalid`). Rolle `vorschau` darf nur lesen, kein Admin-Zugang, sieht keine Benutzer. `authenticated` heißt jetzt „Mitarbeitende“ (`isStaff`).
- **Caddy** (`docker/Caddyfile`): statisch aus `www/current/client`, `/media` aus dem Media-Volume, `/api/form` + `/preview/*` → web:4322, `/internal/*` gesperrt, 404 → Builder, `X-Robots-Tag: noindex` (Lab). Das CMS sendet immer `X-Robots-Tag: noindex`.
- **Lokal testen:** `docker compose --env-file apps/web/.env -f docker/compose.local.yml up --build` (Web + Caddy gegen das CMS auf dem Mac, Website auf http://localhost:8130), dann `BASE_URL=http://localhost:8130 pnpm test` in `apps/web`. Letzter Lauf: 92/92. Ausfalltest (CMS gestoppt): Website, Suche, Downloads, Medien laufen weiter; Formular antwortet mit Fehlerseite; Neubau schlägt fehl, alte Fassung bleibt.

### Website `apps/web` (Phase 6/5 – Grundgerüst fertig)
- **Routing:** eine Route `src/pages/[...path].astro`; `src/lib/routes.ts` erzeugt alle URLs aller Sprachen aus den veröffentlichten Inhalten. Feste Bereiche je Sprache in `src/i18n/index.ts` (`aktuelles`/`news`, `termine`/`events`, `downloads`, `suche`/`search`, `danke`/`thank-you`). Startseite = Page mit Slug `home`.
- **Sprachen:** `/`, `/leichte-sprache/…`, `/en/…`. Inhalte ohne Fassung werden nicht erzeugt, der Sprachumschalter zeigt nur vorhandene Fassungen, `hreflang` im Head. Verweist ein Link auf ein Ziel ohne Fassung in der aktuellen Sprache, zeigt er auf die deutsche Fassung. Leichte Sprache: `html.ls` (19 px, Zeilenabstand 1,75), UI-Texte in Leichter Sprache.
- **Datenzugriff:** `src/lib/cms.ts` (REST, immer `locale` + `fallback-locale=none`, Anfragen werden pro Build gecacht).
- **Rich Text:** eigener kleiner Renderer `components/RichText.astro` statt `convertLexicalToHTML` – kein Payload im Frontend, volle Kontrolle über Links (externe Links/neue Tabs werden für Screenreader angesagt). Eingebettete Blöcke: Bild, Akkordeon, Downloads.
- **Alle 13 Blöcke** in `components/blocks/`. Listen-Blöcke fragen zur Build-Zeit ab (`lib/queries.ts`).
- **Navigation:** Mega-Menü als Disclosure (APG) mit Escape/Fokus-Rückgabe; ohne JS normale Linklisten. Mobil Menü-Schalter.
- **Downloads:** ohne JS nach Kategorie gruppiert; mit JS Filter (Kategorie, Bereich) mit Statusansage und URL-Parametern.
- **Suche:** Pagefind Component UI (seit Pagefind 1.5 empfohlen, bessere ARIA-Unterstützung). Deutsch und Leichte Sprache teilen den Index `de`, getrennt über den Filter `sprache`.
- **Formulare:** `src/pages/api/form.ts` (on demand) prüft gegen die Formulardefinition, Honeypot, Rate-Limit (5 pro 10 min und IP, im Speicher), legt den Formular-Eingang an und leitet auf `/danke/` bzw. das im Formular hinterlegte Ziel. Fehler ohne JS als einfache Fehlerseite.
- **Bilder:** `<img srcset>` aus den Payload-WebP-Größen, Fokuspunkt als `object-position`. Medien-URL: `MEDIA_URL` (Caddy `/media/images|documents/…`) oder lokal die Datei-Route des CMS.
- **Tests:** `pnpm test` in `apps/web` (Playwright gegen den Build, Desktop + Pixel 7): axe WCAG 2.2 AA für 18 Seitentypen/Sprachen, eine H1, Landmarks, Skip-Link, Sprachumschalter, Mega-Menü per Tastatur, ohne JS, Reflow 320 px, Download-Filter, Formular. Letzter Lauf: 92/92 bestanden.

### Lab-Umgebung `docker.fritz.box` (SSH: `root@docker.fritz.box`, LAN-IP 192.168.20.203)
| Port | Dienst | Domain (NPM) | Status |
|---|---|---|---|
| 8130 | Caddy (Website, `/media`, `/preview`, `/api/form`) | ccvbastro.lab.code-ops.de | siehe Phase 4 |
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

Reihenfolge als Vorschlag. **Als Nächstes:** Lab-Deploy (Rest von Phase 4), dann Phase 7 bzw. Design-Abstimmung.

### Phase 6 und 5: Restpunkte Frontend
- **2-Klick-Einbettung** für YouTube/Instagram: es gibt noch keinen Einbettungs-Block im CMS. Block anlegen (URL + Titel), Frontend-Komponente mit Platzhalter und Einwilligungs-Schalter (UI-Texte `embedConsent`/`embedNotice` liegen schon bereit).
- **Formular-Bestätigung:** Die Danke-Seite ist allgemein; die formularspezifische `confirmationMessage` wird noch nicht angezeigt.
- **Fehlerseite des Formulars** ist bewusst minimal (eigenes HTML). Später an das Layout angleichen.
- **Sitemap** (`@astrojs/sitemap` oder eigene Route) und Open-Graph-Feinschliff.
- **Design** nach Abstimmung angleichen (nur Tokens + Komponenten-Klassen). SVG-Logo besorgen.
- Manueller Test mit Screenreader (VoiceOver/NVDA) und Tastatur – axe findet nur einen Teil der Probleme.

### Phase 4: Restpunkte
- **Lab-Deploy** des neuen Stacks (`./scripts/deploy-lab.sh`), danach in NPM `ccvbastro.lab.code-ops.de` → `192.168.20.203:8130` (Franco). Ausfalltest im Lab wiederholen (`docker compose stop cms`).
- Live-Vorschau im CMS-Admin einmal von Hand prüfen (iframe von ccvbcms auf ccvbastro).
- Builder-Fehler melden (E-Mail/Uptime) → Phase 7.

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
12. **Astro prüft bei POST-Anfragen den `Origin`.** Tests oder Skripte, die `/api/form` direkt aufrufen, brauchen einen passenden `Origin`-Header, sonst 403.
13. **Builds liegen außerhalb des Projekts** (`/data/www/builds/…`). Ihr Server-Code findet Pakete wie `sharp` nur über den Symlink `/data/www/node_modules`, den der Builder beim Start anlegt.
14. **Docker läuft lokal** (Docker Desktop, ggf. erst starten). Container immer zuerst lokal testen (`docker/compose.local.yml`), dann ins Lab.
15. **`next dev` legt `apps/cms/AGENTS.md` und `CLAUDE.md` an** (Hinweis auf Next 16). Beide sind gitignored.
16. **Auto-Mode-Sicherheitsprüfung:** Sie hat zwei Aktionen blockiert:
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
pnpm seed                                  # Beispielinhalte (--force = neu anlegen)

# Website (CMS muss laufen)
cd apps/web
pnpm dev                                   # http://localhost:4321 (ohne Suche – Index entsteht beim Build)
pnpm build                                 # statisch nach dist/client + Pagefind
pnpm typecheck                             # astro check
pnpm test                                  # Playwright + axe gegen den Build (Port 4322)

# Lab
docker compose --env-file apps/web/.env -f docker/compose.local.yml up -d --build   # Web + Caddy lokal
./scripts/deploy-lab.sh            # kompletter Stack
./scripts/deploy-lab.sh cms        # nur CMS (Build auf dem Server, ca. 2 min)
ssh root@docker.fritz.box 'docker logs ccvb-cms-1 --tail 50'
```
