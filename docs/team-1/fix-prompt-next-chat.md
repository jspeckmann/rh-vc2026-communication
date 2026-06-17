# Team 1 Kommunikation: Fix-Auftrag fuer neuen Chat

Arbeitsrepo: `/Users/davidmac/Documents/hackathon`

Zielrepo/PR:
- Richtiges GitHub-Repo: `jspeckmann/rh-vc2026-communication`
- Richtiger Remote: `communication`
- Richtiger PR: `https://github.com/jspeckmann/rh-vc2026-communication/pull/5`
- PR bleibt Draft, bis David explizit ready-for-review sagt.
- Falsches altes Repo `Testo4Torsten/hackathon` nicht als PR-Ziel nutzen.

## Auftrag

Bitte alles reparieren, was fuer eine sauber nutzbare Team-1-Kommunikationsfunktion noetig ist:

1. Sichtbare UI von `Matrix Chat` auf `Chat` bzw. neutrale Chat-Begriffe umbenennen.
2. Alle vorhandenen Backend-Funktionen unter `/api/chat/*` im Frontend nutzbar machen.
3. Backend/Mock/PostgreSQL/API-Vertrag konsistent machen.
4. Evals/Doku nur auf `pass` lassen, wenn es durch Runtime/Code belegt ist.
5. Am Ende alle Checks laufen lassen und nur danach pushen. PR bleibt Draft.

Nutze parallele Subagents fuer getrennte Spuren. Hauptagent bleibt fuer Integration, Endkontrolle, Git und Push verantwortlich.

## Subagent-Spuren

### Spur A: Frontend-API und UI

Owned files:
- `frontend/src/services/api.js`
- `frontend/src/App.jsx`
- `frontend/src/components/chat/ChatSection.jsx`
- `frontend/src/components/wiki/WikiSection.jsx`
- `frontend/src/components/groups/GroupsSection.jsx`
- `frontend/src/components/groups/AddGroupModal.jsx`
- `frontend/src/components/groups/GroupItem.jsx`
- `frontend/src/components/ai-feed/AIFeedPanel.jsx`
- `frontend/src/components/network/NetworkSection.jsx`

Fixes:
- `Matrix Chat` in `ChatSection.jsx` entfernen. Kein Thread-Fallback darf Matrix-spezifisch sein; nutze z.B. `Kein Thread gewaehlt`.
- Zentrale aktuelle Gruppe und aktueller User aus App-/Session-State einfuehren und an Chat, Wiki, AI Feed, Gruppen und Graph durchreichen.
- Harte Defaults `group-team-1` und `user-david` nur noch als letzter Demo-Fallback verwenden, nicht als versteckter Zustand.
- Nach `fetchUsers()` einen gueltigen User aus der geladenen Liste waehlen; keine POSTs mit unbekanntem `authorId`/`userId`.
- `api.js` um fehlende Funktionen ergaenzen:
  - `addGroupMember(groupId, payload)`
  - `linkMatrixUser(payload)`
  - `fetchMatrixUser(userId)`
  - `linkMatrixRoom(payload)`
  - `createWikiArticle(payload)`
  - `updateWikiArticle(articleId, payload)`
  - `rebuildFeed(payload)`
  - `fetchKnowledgeNodes()`
  - `createKnowledgeNode(payload)`
  - `fetchKnowledgeEdges()`
  - `createKnowledgeEdge(payload)`
- Wiki UI um Create/Edit/Update fuer Titel, Body, Tags, Status und aktive Gruppe erweitern.
- Gruppen UI um Member-add und Matrix-Room-Linking erweitern.
- Knowledge Graph UI mindestens um Create Node/Edge oder eine klare Liste/Refresh-Ansicht fuer Nodes/Edges erweitern.
- AI Feed Analyse darf nicht hart `sourceId: thread-matrix-link` und nicht blind `mode: mock` senden. Sie muss aktive Gruppe und sinnvolle Quelle nutzen.
- Sendefehler im Chat mit sichtbarem Retry/Entfernen oder klarem Fehlerzustand behandeln.
- `GroupItem.jsx` darf nicht dauerhaft `Noch keine Eintraege.` anzeigen, wenn keine echten Untereintraege geladen werden. Entweder echte Items anbinden oder den falschen Leerblock entfernen.

Akzeptanz:
- Frontend zeigt keine irrefuehrende `Matrix Chat`-Benennung.
- Alle sichtbaren schreibenden Buttons fuehren echte Backend-POST/PUTs aus.
- Nach Reload bleiben neue Gruppe, Thread, Nachricht, Wiki-Artikel, Member, Matrix-Link und Knowledge-Node/Edge sichtbar.
- `npm --prefix frontend run lint` und `npm --prefix frontend run build` laufen gruen.

### Spur B: Backend/API-Konsistenz

Owned files:
- `src/routes.rs`
- `src/db.rs`
- `src/models.rs`
- `src/state.rs`
- `src/seed.rs`
- `migrations/*.sql`
- `API.md`

Fixes:
- Mock und DB beim primaren Matrix-Raum angleichen:
  - Wenn `POST /api/chat/matrix/rooms/link` mit `isPrimary=true` kommt, darf pro Gruppe nur ein Primary-Room uebrig bleiben.
  - `GET /groups/:id` und neue Messages muessen danach denselben primaeren `matrixRoomId` verwenden.
- `matrix_event_links` klaeren:
  - Entweder beim Message-Create konsistent in DB und Mock persistieren/abrufbar machen,
  - oder aus Vertrag/Evals als interne/out-of-scope Struktur markieren.
- Explizite Validierung vor DB/Mock angleichen:
  - ungueltige `groupId`
  - ungueltige `createdBy`
  - ungueltige `authorId`
  - leerer Titel/Body
  - ungueltiger Thread-`type`
  - unbekannter Wiki-Autor
  - gleiche Statuscodes und gleiches JSON-Fehlerformat in Mock und DB.
- Mock-Sortierung an DB angleichen:
  - Wiki wie DB nach `updatedAt DESC`
  - Feed wie DB nach `createdAt DESC`
- Dashboard-Statuswerte vertraglich sauber machen:
  - `database` z.B. `mock` oder `postgres`
  - `matrix` darf nicht pauschal `linked` sagen, wenn Synapse/Room-Link nicht echt belegt ist.
- API.md-Beispiele an echte Models/OpenAPI angleichen oder explizit als gekuerzt markieren.

Akzeptanz:
- `cargo fmt --check`
- `cargo test --locked`
- lokale HTTP-Readbacks fuer `/health`, `/api/chat`, `/openapi.json`, `/api/chat/groups`, `/api/chat/wiki`, `/api/chat/feed`, `/api/chat/knowledge/graph`, `/api/chat/agent/feed`, `/api/chat/dashboard`

### Spur C: Docker/PostgreSQL/Runtime-Gates

Owned files:
- `Dockerfile`
- `docker-compose.yml`
- `migrations/*.sql`
- `src/main.rs`
- `src/db.rs`
- `docs/team-1/database.md`
- `evals/team-1-kommunikation.json`

Fixes:
- `Dockerfile` muss `migrations/` vor dem Rust-Build kopieren, weil `sqlx::migrate!("./migrations")` compile-time Zugriff braucht.
- Docker/Compose real pruefen, falls Docker verfuegbar ist:
  - `docker compose config`
  - `docker compose build`
  - `docker compose up`
  - Postgres-Migration und Seed-Readback
- Wenn Docker lokal nicht verfuegbar ist, Status in Evals/Doku nicht als `pass` behaupten; als externes Gate mit Owner/Fallback markieren.

Akzeptanz:
- Dockerfile baut mit Migrationen.
- DB-Pfad ist entweder real runtime-belegt oder weiterhin ehrlich `partial`.

### Spur D: Doku/Evals/Submit-Wahrheit

Owned files:
- `evals/team-1-kommunikation.json`
- `docs/team-1/evals.md`
- `docs/team-1/architecture.md`
- `docs/team-1/roadmap.md`
- `docs/team-1/database.md`
- `README.md`
- `API.md`

Fixes:
- Keine Runtime-Evidence in Evals behaupten, die nicht frisch ausgefuehrt wurde.
- `401` und Matrix-`503` klaeren:
  - Entweder echte Runtime-Pfade/Middleware ergaenzen,
  - oder API/Evals als geplanten Platzhalter markieren.
- Synapse/Matrix ehrlich trennen:
  - Implementiert sind aktuell Matrix-Link-Endpunkte.
  - Echter Synapse-Service ist nur `pass`, wenn Compose/Runtime belegt ist.
- `COMM-DATA-001`, `COMM-MATRIX-001`, `COMM-DEP-001`, `COMM-SUBMIT-001` nur auf `pass` setzen, wenn die jeweiligen Gates wirklich belegt sind.

Akzeptanz:
- `jq empty evals/team-1-kommunikation.json`
- Jeder `pass` hat aktuelle, reproduzierbare Evidence.
- Offene Team-Abhaengigkeiten haben Owner, Frage, Fallback und Blocker-Status.

## Abschlusschecks vor Push

Pflicht:
- `git status --short --branch`
- `cargo fmt --check`
- `cargo test --locked`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `npm run check`
- `jq empty evals/team-1-kommunikation.json`
- `git diff --check`

Runtime/Browser:
- Backend auf richtigem Port/CWD pruefen, nicht blind Standardport nutzen.
- Frontend auf richtigem Port/CWD pruefen.
- Browser-Readback:
  - Dashboard zeigt Backenddaten
  - Chat zeigt Backendnachricht
  - neue Message kann bewusst getestet werden
  - Wiki create/update bewusst testen
  - Gruppen Member-add und Matrix-Link bewusst testen
  - Knowledge Node/Edge create/list bewusst testen
  - AI Feed Analyse/Feedback bewusst testen
  - DOM-Check keine verschachtelten Buttons

Git/GitHub:
- Vor Push Remote pruefen: `communication -> git@github.com:jspeckmann/rh-vc2026-communication.git`
- Nicht `origin`/`Testo4Torsten/hackathon` als PR-Ziel verwenden.
- Nur passende Dateien stagen, keine Secrets, `.env`, `.codex`, `node_modules`, `target`, `frontend/dist`, Caches oder lokale Build-Ausgaben.
- Push auf Branch `codex/team1-communication-api`.
- PR #5 bleibt Draft.

## Gewuenschte finale Antwort

Kurz auf Deutsch:
- Was wurde repariert?
- Welche Checks sind gruen?
- Welche Runtime/Browser-Readbacks wurden gemacht?
- Welcher Commit wurde gepusht?
- PR-Link und Draft-Status.
