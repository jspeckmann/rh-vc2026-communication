# Team 1 Kommunikation: Roadmap

Stand: 2026-06-17

## Leitlinie

Erst Vertrag und Datenmodell stabil machen, dann lokal/mockbar bauen, danach
Matrix und externe Team-Abhaengigkeiten anschliessen, zuletzt Submit pruefen.

Die konkrete parallele Ausfuehrung steht in
`docs/team-1/implementation-plan.md`. Diese Roadmap bleibt die Phasen- und
Gate-Uebersicht; der Implementation Plan ist die Arbeitsanweisung fuer
Subagents.

## Phase 0: Kontext Einfrieren

Ziel: Alle starten von denselben Quellen.

Dateien:

- `docs/project-context.md`
- `docs/team-1/index.md`
- `docs/team-1/architecture.md`
- `API.md`
- `docs/team-1/database.md`
- `docs/team-1/evals.md`

Implementieren ohne Nachfrage:

- tote Pfade korrigieren
- alte MVP-Dateien ins Archiv verschieben
- README als Index knapp halten

Fragen/Gegencheck:

- keine, solange keine Inhalte geloescht werden

Gate:

- Ein neuer Chat findet Einstieg, Architektur, API, DB, Roadmap und Evals ohne
  Chat-Historie.

Stop:

- Wenn alte und neue Dateien widerspruechliche Projektwahrheiten enthalten.

## Phase 1: Vertrag Einfrieren

Ziel: API und DB sind stabil genug, damit gebaut wird.

Dateien:

- `API.md`
- `docs/team-1/database.md`
- `docs/team-1/evals.md`

Implementieren ohne Nachfrage:

- Endpunkte, Request-/Response-Beispiele und Fehlerformat festziehen
- DB-Tabellen und Beziehungen dokumentieren
- Submit-Minimum markieren

Fragen/Gegencheck:

- Reicht `API.md`, oder muss `/openapi.json` live sein?
- Ist Rust/Axum/SQLx als Backend-Stack fuer das Team akzeptiert?
- Reichen SQLx-Migrationen plus Seed-Funktion, oder will das Backend-Team ein
  separates `schema.sql`/`seed.sql`?

Gate:

- API-Vertrag und DB-Plan widersprechen sich nicht.
- EVAL-COMM-001 bis EVAL-COMM-004 sind mindestens dokumentiert.

Stop:

- Wenn Route, Port, Auth-Quelle oder DB-Wahrheit unklar werden.

## Phase 2: Rust/Axum-Grundmodul

Ziel: Ein minimales Modul laeuft lokal auf Port `8001`.

Implementieren ohne Nachfrage:

- Projektstruktur fuer Rust/Axum-API
- `GET /health`
- `/api/chat`-Router plus lokale `/chat`-Aliasroute
- JSON-Fehlerformat
- Dummy-Useradapter
- `GET /api/chat/users`
- `GET /api/chat/users/:id`

Fragen/Gegencheck:

- keine an David noetig

Gate:

- `GET /health` liefert `{"status":"ok"}`.
- `/openapi.json` ist erreichbar oder `API.md` ist klar als Doku-Ersatz
  markiert.

Stop:

- Wenn Port `8001`, Frontend-Route `/chat` oder Backend-Route `/api/chat` mit
  Team-Konventionen kollidieren.

## Phase 3: PostgreSQL-Schema Und Seeds

Ziel: PostgreSQL wird echte Modul-Wahrheit.

Implementieren ohne Nachfrage:

- Tabellen aus `docs/team-1/database.md`
- idempotente Seed-Daten
- `.env.example` mit Platzhaltern
- Demo-Daten: 3 User, 2 Gruppen, Threads, Wiki, Feed, Graph, Agent-Feed

Fragen/Gegencheck:

- Migrationstechnik: SQLx-Migrationen oder `schema.sql`/`seed.sql`

Gate:

- API liest Gruppen/Wiki/Feed/Graph/Agent aus DB, nicht aus Hardcode.
- Seed-Daten lassen keine leeren Hauptansichten entstehen.

Stop:

- Wenn DB-Initialisierung nicht reproduzierbar ist.

## Phase 4: Core-API

Ziel: Der fachliche Kern laeuft ohne Matrix-Komplexitaet.

Implementieren ohne Nachfrage:

- Gruppen und Mitglieder
- Threads und `messages_cache`
- Wiki
- Feed
- `400`, `401`, `404` Fehlerformat

Fragen/Gegencheck:

- keine an David noetig, solange `API.md` eingehalten wird

Gate:

- `GET /api/chat/groups`, `GET /api/chat/wiki`, `GET /api/chat/feed` funktionieren mit
  Seed-Daten.

Stop:

- Wenn Datenmodell und API-Beispiele nicht zusammenpassen.

## Phase 5: Matrix-Linking

Ziel: Matrix ist nachweisbar Chat-Layer, ohne Vollsync zu bauen.

Implementieren ohne Nachfrage:

- `matrix_user_links`
- `matrix_room_links`
- `matrix_event_links`
- Matrix-Link-Endpunkte
- Matrix-Ausfall als `503`

Fragen/Gegencheck:

- Legt unser Modul Matrix-Raeume selbst an oder verlinkt es vorhandene Raeume?
- Werden Demo-User/Raeume vorbereitet oder echte Registrierung genutzt?
- Wie wird Synapse im Compose/Gateway eingebunden?

Gate:

- User und Gruppen koennen mit Matrix-Usern/Raeumen verlinkt werden.
- Matrix bleibt Chat-Layer; PostgreSQL bleibt Modul-Wahrheit.

Stop:

- Wenn Synapse-Setup zu viel Zeit frisst: Link-API plus Compose-Plan liefern
  und echten Synapse-Readback als offenes Gate markieren.

## Phase 6: Knowledge Graph Und Dashboard

Ziel: Beziehungen und Gesamtuebersicht sind sichtbar und per API nutzbar.

Implementieren ohne Nachfrage:

- Nodes/Edges lesen und erstellen
- `GET /api/chat/knowledge/graph`
- `GET /api/chat/dashboard`
- Dashboard mit API, DB, Matrix, LLM, User-Dummy, Feed, Wiki, Agent, Graph

Fragen/Gegencheck:

- keine an David noetig

Gate:

- Dashboard zeigt keine leeren Hauptbereiche.
- Knowledge Graph enthaelt Personen, Gruppen, Wiki-Artikel, Entscheidungen und
  Beziehungen.

Stop:

- Wenn Dashboard Pflichtbereiche aus `docs/team-1/ui-brief.md` nicht zeigt.

## Phase 7: LLM-Agent Und Agent-Feed

Ziel: Agent-Feed ist ohne Secret pruefbar; echter LLM-Key bleibt ENV.

Implementieren ohne Nachfrage:

- Mock/Fallback-Modus
- `POST /api/chat/agent/analyze`
- `GET /api/chat/agent/feed`
- `GET /api/chat/agent/feed/:id`
- `POST /api/chat/agent/feed/:id/feedback`
- Daumen-hoch/-runter persistieren

Fragen/Gegencheck:

- Welcher LLM-Provider wird genutzt?
- Welche ENV-Namen sind Teamstandard?
- Soll Team 4 Agent-Task-Listen spaeter importieren?

Gate:

- Ohne Key erzeugt der Agent sinnvolle Mock-Elemente.
- Feedback wird gespeichert.
- Keine Secrets liegen im Repo.

Stop:

- Wenn echter LLM-Key fehlt: Mock/Fallback bleibt Submit-Pfad.

## Phase 8: Test-UI / Demo

Ziel: Das Modul ist fuer Demo und Teamabgleich sichtbar.

Implementieren ohne Nachfrage:

- einfache `/chat` Test-UI
- Dashboard, Gruppen, Matrix-Chat, Wiki, Graph, Agent-Feed
- Dummy-Daten statt leerer Screens

Fragen/Gegencheck:

- heller oder dunkler Startmodus
- Wireframes oder Design-Team-Screens
- finale Button-/Card-/Input-Regeln

Gate:

- Eine Person sieht alle Pflichtbereiche ohne Erklaerung.

Stop:

- Wenn Design-Team-Vorgaben der aktuellen UI widersprechen.

## Phase 9: Docker, Gateway Und Submit

Ziel: Abgabefaehiges Modul.

Implementieren ohne Nachfrage:

- `Dockerfile`
- Compose-Services fuer API, PostgreSQL, Synapse
- Traefik-Labels fuer `/api/chat` und Port `8001`
- `.env.example`
- Eval-Readback

Fragen/Gegencheck:

- Team-3 `modules.json`
- Traefik-Regel
- Auth/JWT-Felder
- Synapse-Startstrategie

Gate:

- Alle Evals sind `pass` oder als externe Abhaengigkeit mit Owner, Frage,
  Fallback und Blocker-Status markiert.

Stop:

- Bei Server, Deployment, Push oder Netzwerk: vorher explizite Freigabe.
