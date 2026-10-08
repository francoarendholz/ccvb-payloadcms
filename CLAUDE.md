# CCVB-Website (Payload CMS + Astro)

Vor jeder Arbeit **`docs/PLAN.md` lesen**: Entscheidungen, Stand, offene Phasen und bekannte
Stolperfallen (Lokalisierung, TOTP-Plugin, Migrationen, Lab-Deploy).

- Kommunikation auf Deutsch. Entscheidungen auf Tech-Stack-Ebene mit Franco abstimmen, Code-Details nicht.
- Secrets liegen in `.env`, `.env.lab` und `apps/cms/.env` (gitignored) – nie ausgeben oder committen.
- Lab-Host: `ssh root@docker.fritz.box`, Deploy über `./scripts/deploy-lab.sh`.
- Nach Schema-Änderungen: `pnpm generate:types`, ggf. `pnpm generate:importmap`, `pnpm payload migrate:create <name>` (in `apps/cms`).
