# Team 1 Kommunikation: Uebergabe Aktueller Stand

Stand: 2026-06-17

## Git/PR

- Zielrepo: `jspeckmann/rh-vc2026-communication`
- Remote: `communication`
- Branch: `codex/team1-communication-api`
- PR: https://github.com/jspeckmann/rh-vc2026-communication/pull/5
- PR bleibt Draft, bis David ausdruecklich ready-for-review sagt.
- Nicht `origin` / `Testo4Torsten/hackathon` als PR-Ziel nutzen.

## Was jetzt nutzbar ist

- Backend liefert die Team-1-Kommunikations-API unter `/api/chat`.
- Lokale Dev-Aliasroute `/chat` bleibt vorhanden.
- Dashboard, Gruppen, Chat-User/Chat-Raeume, Knowledge Graph, Wiki und
  Assistenz-Feed haben Demo-/Seed-Daten.
- Frontend ist an die vorhandenen Backend-Funktionen angebunden:
  - Dashboard liest Status, Feed und Kennzahlen.
  - Gruppenansicht kann Chat-User und Chat-Raeume verlinken.
  - Dashboard kann einen Feed-Rebuild ausloesen.
  - Backend-Fehler werden im Frontend als Inline-Fehler angezeigt.
- Die sichtbare UI nutzt Produktbegriffe wie `Chat`, `Chat-User`,
  `Chat-Raeume` und `Assistenz-Feed`; technische Protokollbegriffe bleiben
  im API-/Backend-Vertrag.

## Lokal geprueft

Diese Checks waren am 2026-06-17 gruen:

```bash
cargo fmt --check
cargo check --locked
cargo test --locked
npm --prefix frontend run lint
npm --prefix frontend run build
npm run check
jq empty evals/team-1-kommunikation.json
git diff --check
```

Browser-Readback lokal:

- Dashboard auf `http://127.0.0.1:5174/dashboard`
- Gruppenansicht auf `http://127.0.0.1:5174/groups`
- Keine sichtbaren `Matrix`-/`Mock`-/`Dummy`-Texte in den geprueften Views.
- Feed-Rebuild wurde im Dashboard angenommen.

## Noch offen fuer Admin-/Modulverbund

- Server-Docker-Build ist noch nicht gruen:
  - `docker compose config --quiet` war auf `david@192.168.2.250` gruen.
  - Host-`cargo` fehlt dort, soll aber nicht als Voraussetzung gelten.
  - Docker-Build blockierte bei crates.io DNS/getaddrinfo.
  - Externes Docker-Netz `cpp-edge` fehlte.
- PostgreSQL-/Compose-Runtime ist auf dem Server noch nicht final belegt.
- Synapse/echter Chat-Server ist nicht angebunden; aktueller Stand ist Link-only.
- Auth/JWT/Admin-Rechte sind noch nicht runtime-belegt.
- Gateway-/Traefik-/Admin-Anbindung an andere Module erst nach Server- und
  Auth-Readback final freigeben.

## Naechster sinnvoller Schritt

1. Teamkollege prueft diesen Branch lokal gegen Frontend und Backend.
2. Danach Server-DNS/Docker-Netz und Compose-Runtime auf `ryzen-server` klaeren.
3. Erst nach gruenem Server-Readback Admin-/Gateway-Anbindung fuer andere Module
   als fertig markieren.
