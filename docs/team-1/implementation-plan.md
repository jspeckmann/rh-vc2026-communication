# Team 1 Kommunikation: Konkreter Umsetzungsplan

Stand: 2026-06-17

## Ziel

Dieser Plan uebersetzt Roadmap, API-Vertrag und Team-Konventionen in
parallelisierbare Arbeitspakete. Er ist fuer lokale Solo-/Subagenten-Arbeit
gedacht: schnell bauen, klar trennen, danach gemeinsam integrieren.

Aktuelle Basis:

- Backend: Rust/Axum
- API-Basis ueber Gateway: `/api/chat`
- lokale Dev-Aliasroute: `/chat`
- Port: `8001`
- Datenbank: PostgreSQL mit SQLx
- Frontend: zentral verwaltet; dieses Repo liefert Backend und API-Daten

## Arbeitsprinzip

- Hauptagent bleibt fuer Integration, finale Entscheidungen und Readback
  verantwortlich.
- Subagents bekommen getrennte Besitzbereiche, damit sie parallel arbeiten
  koennen.
- Kein Subagent entscheidet final ueber echte JWT-Felder, echten User-Endpunkt,
  Synapse-Grundsatz, Gateway-Registrierung, Deployment oder LLM-Provider.
- Alle Runtime-Claims brauchen Evidence: Test, Kommando oder API-Readback.
- Keine Secrets, `.env`, Datenbanken, Caches, Build-Ausgaben oder Tokens ins
  Repo.

## Aktueller Fertigstand

Schon umgesetzt:

- Rust/Axum-Grundmodul mit `GET /health`
- `/openapi.json`
- `/api/chat`-Router und lokale `/chat`-Aliasroute
- Dummy-Useradapter: `GET /api/chat/users`,
  `GET /api/chat/users/{id}`
- JSON-Fehlerformat fuer `400`, `404` und nicht verfuegbare DB/Matrix
- Dockerfile/Compose-Grundstruktur fuer Rust-Service und PostgreSQL-Plan
- Doku-Trennung: Frontend `/chat`, Backend `/api/chat`
- SQLx/PostgreSQL-Migrationen und Demo-Seed-Datei
- Repository-/DB-Funktionen in `src/db.rs`; Routen nutzen PostgreSQL, sobald
  `DATABASE_URL` gesetzt ist, sonst den Mock-State
- Gruppen, Threads, Messages, Wiki, Feed
- `PUT /api/chat/wiki/{id}` und `POST /api/chat/feed/rebuild`
- Knowledge Graph inklusive getrennten Node-/Edge-Endpunkten
- Dashboard
- Agent-Feed, Mock-Analyse und Feedback
- Matrix-Link-Endpunkte fuer User und Raeume

Noch offen / bewusst partial:

- Docker-/Compose-/PostgreSQL-Readback gegen echte Runtime
- echter Synapse-Service und Raum-Anlage; aktuell sind Matrix-Endpunkte Links
- echte JWT/Auth-Validierung und echtes Usermodul; aktuell Dummy-/Fallback-Adapter
- Gateway-`modules.json` und Team-4-Planning-Import; aktuell nur dokumentierte
  Integrationspunkte, keine fremden Repo-Mutationen

## Welle 0: Integrationsbasis

Besitz: Hauptagent

Ziel: Kleine gemeinsame Struktur schaffen, bevor mehrere Subagents Code
aendern.

Dateien:

- `src/lib.rs`
- `src/main.rs`
- neue Rust-Module nach Bedarf, z. B. `src/error.rs`, `src/models.rs`,
  `src/state.rs`

Aufgaben:

- gemeinsame Response-/Fehler-Typen aus `src/lib.rs` auslagern
- API-Modelle zentral definieren
- App-State so vorbereiten, dass DB-Pool und Mock-Daten austauschbar bleiben
- Tests fuer Health, OpenAPI, Useradapter behalten

Gate:

- `cargo test` bleibt gruen
- `/health`, `/api/chat/users`, `/openapi.json` laufen lokal

## Welle 1: Parallel Bauen

### Lane A: DB, SQLx Und Seeds

Besitz: Subagent A

Dateien:

- `Cargo.toml`
- `migrations/*`
- `src/db.rs`
- `src/seed.rs`
- `.env.example`

Aufgaben:

- SQLx mit PostgreSQL anbinden
- Migrationen fuer Mindesttabellen aus `docs/team-1/database.md`
- idempotente Seed-Funktion
- Demo-Daten: 3 User, 2 Gruppen, Threads, Wiki, Feed, Graph, Agent-Feed,
  Feedback

Abhaengigkeiten:

- nutzt Modelle aus Welle 0
- darf keine API-Routen umbauen, ausser fuer DB-State-Anbindung

Checks:

- `cargo test`
- Migrationen sind nachvollziehbar
- Seed-Funktion laeuft mehrfach ohne Duplikat-Fehler

### Lane B: Core-API

Besitz: Subagent B

Dateien:

- `src/routes/groups.rs`
- `src/routes/threads.rs`
- `src/routes/wiki.rs`
- `src/routes/feed.rs`
- `src/lib.rs` nur fuer Router-Registrierung

Aufgaben:

- `GET /api/chat/groups`
- `POST /api/chat/groups`
- `GET /api/chat/groups/{id}`
- `POST /api/chat/groups/{id}/members`
- `GET /api/chat/threads`
- `POST /api/chat/threads`
- `GET /api/chat/threads/{id}/messages`
- `POST /api/chat/threads/{id}/messages`
- `GET /api/chat/wiki`
- `POST /api/chat/wiki`
- `GET /api/chat/feed`

Abhaengigkeiten:

- Datenmodell aus Welle 0
- DB-Schema aus Lane A; bis dahin darf gegen Repository-/Mock-Struktur gebaut
  werden

Checks:

- API-Beispiele aus `API.md` werden eingehalten
- `400` und `404` nutzen gemeinsames Fehlerformat
- Hauptansichten starten mit Seed-Daten nicht leer

### Lane C: Graph, Dashboard Und Agent

Besitz: Subagent C

Dateien:

- `src/routes/knowledge.rs`
- `src/routes/dashboard.rs`
- `src/routes/agent.rs`
- `src/agent.rs`
- `src/lib.rs` nur fuer Router-Registrierung

Aufgaben:

- `GET /api/chat/knowledge/graph`
- `GET /api/chat/dashboard`
- `POST /api/chat/agent/analyze`
- `GET /api/chat/agent/feed`
- `GET /api/chat/agent/feed/{id}`
- `POST /api/chat/agent/feed/{id}/feedback`
- Mock/Fallback-Agent ohne echten API-Key

Abhaengigkeiten:

- Seed-Daten aus Lane A
- Core-Objekte aus Lane B
- finaler LLM-Provider bleibt offen; kein Secret und keine Provider-Festlegung

Checks:

- Graph enthaelt mindestens Personen, Gruppen, Wiki-Artikel, Threads und
  Beziehungen
- Dashboard zeigt API, DB, Matrix, LLM, User-Dummy, Feed, Wiki, Agent, Graph
- Agent erzeugt ohne Key sinnvolle Mock-Items
- Feedback speichert Daumen hoch/runter

### Lane D: Matrix-Linking

Besitz: Subagent D

Dateien:

- `src/routes/matrix.rs`
- `src/matrix.rs`
- `docker-compose.yml` nur fuer vorbereitete Service-/ENV-Ergaenzungen
- `docs/team-1/architecture.md` nur fuer offene Synapse-Fragen

Aufgaben:

- `POST /api/chat/matrix/users/link`
- `GET /api/chat/matrix/users/{userId}`
- `POST /api/chat/matrix/rooms/link`
- `GET /api/chat/matrix/rooms`
- `matrix_event_links` fuer Matrix-Event-Referenzen vorbereiten
- Matrix-Ausfall als `503` modellieren

Abhaengigkeiten:

- Synapse-Strategie bleibt offene Team-Frage: Raeume selbst anlegen oder nur
  vorhandene Raeume verlinken
- darf keinen echten Synapse-Login oder Token voraussetzen

Checks:

- Link-Endpunkte funktionieren mit Demo-Daten
- Matrix bleibt Chat-Layer, PostgreSQL bleibt Modul-Wahrheit
- echter Synapse-Readback bleibt als externer Gate markiert, falls kein Docker
  vorhanden ist

### Lane E: Docker, Gateway, Evidence

Besitz: Subagent E

Dateien:

- `Dockerfile`
- `docker-compose.yml`
- `README.md`
- `CONTRIBUTING.md`
- `docs/team-1/evals.md`
- `evals/team-1-kommunikation.json`

Aufgaben:

- Compose-Service-Namen, ENV und Traefik-Labels gegen Team-Konventionen pruefen
- `modules.json`-Snippet fuer Team 3 dokumentieren, aber nicht in fremdem Repo
  mutieren
- Evidence-Abschnitt fuer lokale Checks vorbereiten
- Docker-Blocker sichtbar machen, wenn lokal kein Docker verfuegbar ist

Abhaengigkeiten:

- kein Deployment, kein Server, kein GitHub-Push ohne aktuelle Freigabe

Checks:

- YAML parsebar
- `cargo test`
- `docker compose config`, sobald Docker verfuegbar ist
- lokale API-Readbacks dokumentiert

### Lane F: Contract Und Verification

Besitz: Subagent F

Dateien:

- `docs/team-1/evals.md`
- `evals/team-1-kommunikation.json`
- `CONTRIBUTING.md`
- `README.md`

Aufgaben:

- Status je `COMM-*` pruefen: `pass`, `partial`, `not_checked`, `fail`
- keine Runtime-Evals auf `pass` setzen, wenn nur Doku existiert
- lokale Checkliste fuer Evidence aktuell halten
- offene externe Entscheidungen mit Owner, Frage, Fallback und Blocker-Status
  festhalten

Checks:

- `jq empty evals/team-1-kommunikation.json`
- `git diff --check`
- alle `pass`-Eintraege haben Evidence
- Docker/DB/Synapse ohne Docker-Readback bleiben hoechstens `partial`

## Docker- Und Server-Grenze

Diese Planung bleibt `local-light`, solange nur lokal gelesen, editiert,
gebaut und per `localhost` geprueft wird.

Ohne lokale Docker-CLI duerfen Docker/Compose/PostgreSQL/Synapse nur so weit
bewertet werden:

- YAML parsebar: `partial`
- Compose-Plan stimmt mit Team-Konventionen ueberein: `partial`
- echter Container-/DB-/Synapse-Readback fehlt: kein Runtime-`pass`

`server-authoritative` ist noetig fuer:

- `docker compose config`
- `docker compose build`
- `docker compose up`
- Postgres-Volume und Seed-Readback
- Synapse-Readback
- Gateway-/Traefik-Readback

`admin-protected` ist noetig fuer:

- Netzwerk, Firewall, Router, DNS, externe Ports
- Service-Restarts ausserhalb lokaler Dev-Prozesse
- Deployment oder GitHub-Push

## Welle 2: Integration

Besitz: Hauptagent

Aufgaben:

- Subagent-Diffs zusammenfuehren
- Konflikte in `src/lib.rs`, `Cargo.toml`, `docker-compose.yml` und
  gemeinsamen Modellen aufloesen
- OpenAPI-Pfade mit `API.md` vergleichen
- Evals von `not_checked` auf `pass` oder `partial` setzen, nur mit Evidence
- lokale Readbacks ausfuehren

Pflichtchecks:

- `cargo test`
- `cargo test --locked`
- `cargo fmt --check`, sobald `rustfmt` verfuegbar ist
- `jq empty evals/team-1-kommunikation.json`
- YAML-Parse fuer `docker-compose.yml`
- `git diff --check`
- `GET /health`
- `GET /api/chat/users`
- `GET /api/chat/groups`
- `GET /api/chat/wiki`
- `GET /api/chat/feed`
- `GET /api/chat/knowledge/graph`
- `GET /api/chat/agent/feed`
- `GET /api/chat/dashboard`

## Welle 3: Externe Gates

Nur nach Freigabe beziehungsweise Team-Rueckmeldung:

- Team 3/5: JWT-Felder, Issuer, Rollen, Admin-Rechte
- Team 5: echter User-Endpunkt und stabile User-ID
- Team 3: Gateway-Registrierung und `modules.json`
- Team 3/DevOps: Synapse-Startstrategie
- Team intern: finaler LLM-Provider und ENV-Namen
- Server/Docker/Deployment: nur mit ausdruecklicher aktueller Freigabe

## Naechste Ausfuehrung

Empfohlener Start:

1. Hauptagent erledigt Welle 0.
2. Danach parallel: Lane A, Lane B, Lane C und Lane F.
3. Danach parallel: Lane D und Lane E; beide stimmen `docker-compose.yml`
   vorher als geteilten Besitzbereich ab.
4. Hauptagent integriert, prueft und markiert Evals mit Evidence.

Warum so:

- DB/Seeds sind der wichtigste Engpass.
- Core-API und Graph/Agent koennen parallel vorbereitet werden, wenn Modelle und
  Fehlerformat gemeinsam stehen.
- Matrix und Docker sind wichtig, aber enthalten externe Gates und sollten nicht
  den lokalen Kern blockieren.
