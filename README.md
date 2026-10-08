# ccvb-payloadcms

Neue, barrierefreie Website des Cheerleading- und Cheerperformance-Verbands Berlin.
**Payload CMS 3** als Redaktions-Backend, **Astro** als statisches Frontend.

Stand, Entscheidungen und offene Schritte: [docs/PLAN.md](docs/PLAN.md)

## Aufbau

```
apps/cms/          Payload 3 (Admin + REST-API, Next.js)
apps/web/          Astro-Frontend (folgt)
packages/shared/   gemeinsame Konstanten (Bereiche, Sprachen, Rollen) + generierte Payload-Typen
docker/            Dockerfiles, Compose-Stack für das Lab
scripts/           Deploy-Skripte
```

## Lokale Entwicklung

Voraussetzungen: Node 22, pnpm 9, Zugriff auf `docker.fritz.box` (LAN).

```bash
pnpm install
cp apps/cms/.env.example apps/cms/.env   # DATABASE_URL → ccvb_dev auf docker.fritz.box:8132
pnpm dev                                 # CMS: http://localhost:3000/admin
```

Lokal synchronisiert Payload das Datenbankschema automatisch (`ccvb_dev`).
Nach Änderungen am Content-Modell:

```bash
cd apps/cms
pnpm generate:types                    # → packages/shared/src/payload-types.ts
pnpm payload migrate:create <name>     # Migration für Lab/Produktion
```

## Lab-Umgebung (docker.fritz.box)

| Port | Dienst | Domain |
|---|---|---|
| 8130 | Website (Caddy, folgt) | ccvbastro.lab.code-ops.de |
| 8131 | CMS | ccvbcms.lab.code-ops.de |
| 8132 | Postgres (nur LAN) | – |

```bash
./scripts/deploy-lab.sh            # kompletter Stack
./scripts/deploy-lab.sh cms        # nur ein Dienst
```

Das Skript synchronisiert das Repo nach `/opt/ccvb`, kopiert `.env.lab` (Secrets, nicht im Git)
und baut/startet das Compose-Projekt `ccvb`. Migrationen laufen beim Start des CMS automatisch.
