# Hackathon Projektkontext

Stand: 2026-06-17

Dieses Repo sammelt den aktuellen Arbeitskontext fuer Davids Hackathon-Team.
Der Fokus liegt jetzt auf Team 1 und dem Modul `Kommunikation`.

## Veranstaltung

- Hackathon: Vibe-Coding-Hackathon 2026 der Rheinischen Hochschule
- Haupttag: Mittwoch, 17.06.2026, 09:00-18:00
- Ort: POOLHAUS, Vitalisstrasse 100, 50827 Koeln

## Aktueller Fokus

Team 1 baut ein eigenes Modul fuer Kommunikation und Wissen:

- Modulname: `Kommunikation`
- Frontend-Route: `/chat`
- Backend-API-Basis: `/api/chat`
- Lokale Dev-Aliasroute: `/chat`
- Port: `8001`
- Datenformat: REST ueber JSON
- Inhalte: Gruppen, Diskussionen, Nachrichten, Wiki/Knowledge Base
- Datenbank: PostgreSQL als Modul-Wahrheit; Matrix/Synapse als Chat-Zielbild
- Aktuell ehrlich belegt: Matrix-Link-Endpunkte und statische DB-/API-Pfade;
  nicht frisch belegt: PostgreSQL-Runtime, Docker/Compose-Up, Synapse-Service,
  Auth/401-Middleware und Matrix-503-Ausfallpfad
- Agent: eigener Agent-Feed mit Daumen-hoch/-runter-Feedback
- Pflicht: Healthcheck, API-Doku, Dockerfile, Traefik-Anbindung

## Lokaler Backend-Slice

Soll lokal pruefbar sein ueber:

- Rust/Axum-Service: `cargo run`
- Healthcheck: `GET http://127.0.0.1:8001/health`
- Gateway-kompatible API: `GET http://127.0.0.1:8001/api/chat/users`
- Lokale Aliasroute: `GET http://127.0.0.1:8001/chat/users`
- OpenAPI: `GET http://127.0.0.1:8001/openapi.json`

Diese README behauptet keinen frischen Runtime-Readback.

## Aktuelle Struktur

- `docs/project-context.md`: aktuelle Projektwahrheit
- `CONTRIBUTING.md`: Submit-Regeln fuer Team 1 Kommunikation
- `docs/team-1/index.md`: Startpunkt und Lesereihenfolge fuer Team 1
- `API.md`: REST-/JSON-Vertrag mit Beispiel-Requests und Responses
- `docs/team-1/architecture.md`: Architektur des Team-1-Moduls
- `docs/team-1/database.md`: DB-Entscheidung und Submit-Schema
- `docs/team-1/roadmap.md`: Reihenfolge fuer Fragen, Implementierung und Gates
- `docs/team-1/implementation-plan.md`: konkreter Subagenten-Umsetzungsplan
- `docs/team-1/evals.md`: Klartext-Evals fuer das Modul
- `docs/team-structure.md`: Gruppen, Rollen, Merge-Regeln
- `evals/team-1-kommunikation.json`: maschinenlesbare Eval-Struktur
- `docs/archive/openboard-mvp/`: alter OpenBoard-/Kanban-MVP-Hintergrund

## Hintergrund

Die alten OpenBoard-/MVP-Dateien liegen im Archiv. Sie bleiben Hintergrund,
sind aber nicht mehr die aktuelle Arbeitswahrheit fuer Davids heutigen Part.
Massgeblich fuer Team 1 sind `docs/project-context.md` und
`docs/team-1/index.md`.
