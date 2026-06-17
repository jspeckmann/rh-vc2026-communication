# Team 1 Kommunikation: Fixliste Fuer Voll Nutzbares Modul

Stand: 2026-06-17

Ziel: Das Kommunikationsmodul muss im eigenen Modul nutzbar sein und fuer andere
Teams sauber anbindbar bleiben. Alles, was nicht frisch runtime-belegt ist,
bleibt `partial`; kein Doku-`pass` ersetzt Runtime-Readback.

Repo/PR-Regeln:
- Zielrepo: `jspeckmann/rh-vc2026-communication`
- Remote: `communication`
- Branch: `codex/team1-communication-api`
- PR: https://github.com/jspeckmann/rh-vc2026-communication/pull/5
- PR bleibt Draft, bis David ausdruecklich ready-for-review sagt.
- Nicht `origin` / `Testo4Torsten/hackathon` als PR-Ziel nutzen.

## Subagent-Spuren

- Backend/API: Validierung, DB/Mock-Konsistenz, API-Vertrag, Matrix/Auth-Gates.
- Server/Docker/Runtime: `ryzen-server`, Docker-Build, Compose, Postgres,
  Gateway-Gates.
- Frontend/UX-Anbindung: alle vorhandenen `/api/chat/*` Funktionen im UI
  nutzbar machen; Design-Polish bleibt eine spaetere separate Spur.

## P0 Blocker

### 1. Server-Docker-Build reparieren

Status vom Server-Test:
- Ziel: `david@192.168.2.250`, Host `pve`
- Docker vorhanden: `26.1.5`
- `docker compose config --quiet`: gruen
- Host-`cargo`: nicht installiert (`cargo: command not found`)
- `docker compose build`: fail bei Cargo/crates.io Download
- Fehler: `failed to download from https://index.crates.io/config.json`
  / `Could not resolve hostname (getaddrinfo() thread failed to start)`
- Zusaetzlicher Gate: Docker-Netzwerk `cpp-edge` fehlt

Fix:
- Docker-Container-DNS/Outbound auf `ryzen-server` isoliert pruefen.
- Kein Host-`cargo`/`npm` installieren; Build soll im Dockerfile laufen.
- `cpp-edge` nur nach aktueller Freigabe erstellen oder Compose-Netz an den
  realen Traefik/Gateway-Netznamen anpassen.

Checks:
```bash
ssh david@192.168.2.250 'hostname; docker --version; docker compose version'
ssh david@192.168.2.250 'docker network ls --format "{{.Name}}" | grep -x cpp-edge || true'
ssh david@192.168.2.250 'docker run --rm rust:1.95-slim sh -lc "cat /etc/resolv.conf; cargo search axum --limit 1"'
ssh david@192.168.2.250 'cd <SERVER_REPO> && DOCKER_BUILDKIT=1 docker compose build --progress=plain team1-kommunikation'
```

Pass-Gate:
- Image baut fertig.
- `cpp-edge` ist vorhanden oder Compose nutzt nachweislich das richtige
  Gateway-Netz.

Partial-Gate:
- Compose config ist ok, aber crates.io oder Gateway-Netz blockiert weiter.

### 2. Postgres-/Runtime-Readback auf Server

Fix:
- Nach erfolgreichem Build isoliert `docker compose up` starten.
- Postgres muss `healthy` sein.
- Backend muss mit `DATABASE_URL` starten und Migration/Seed laufen lassen.

Checks:
```bash
ssh david@192.168.2.250 'cd <SERVER_REPO> && docker compose up -d team1-postgres'
ssh david@192.168.2.250 'cd <SERVER_REPO> && docker compose ps'
ssh david@192.168.2.250 'cd <SERVER_REPO> && docker compose up -d team1-kommunikation'
ssh david@192.168.2.250 'curl -fsS http://127.0.0.1:8001/health'
ssh david@192.168.2.250 'curl -fsS http://127.0.0.1:8001/api/chat/dashboard'
```

Pass-Gate:
- Postgres `healthy`.
- Backend `running`.
- Dashboard meldet `database: "postgres"`.
- Seed-Daten fuer Gruppen, Wiki, Feed, Graph und Agent-Feed sind sichtbar.

### 3. Backend-Fehlersemantik DB und Mock angleichen

Status: statisch umgesetzt fuer die bekannten Schreib-/Detailpfade in
`src/routes.rs`, `src/db.rs` und `API.md`; noch nicht gegen PostgreSQL-Runtime
auf dem Server belegt.

Betroffen:
- `src/routes.rs`
- `src/db.rs`
- `src/error.rs`
- `API.md`

Problem:
- Route-/Mock-Validierungen liefern teils feldgenaue `400`.
- DB-Fallbacks liefern bei `23503`/`RowNotFound` teils generische Fehler.

Fix:
- Vor jedem DB-Write dieselben `ensure_*` Checks nutzen wie im Mock-Pfad.
- DB-Constraints nur als Sicherheitsnetz behandeln.
- Fehlercode, HTTP-Status, Message und `field` pro Endpoint in API.md stabil
  dokumentieren.

Akzeptanz:
- Ungueltige `groupId`, `createdBy`, `authorId`, `userId`, Wiki-ID,
  Agent-Feed-ID liefern in Mock und Postgres identisches JSON-Fehlerformat.

### 4. Knowledge-Graph-Validierung vollstaendig machen

Status: statisch umgesetzt in den Routen. Fehlende JSON-Pflichtfelder werden
ueber `RequiredJson<T>` vor der Deserialisierung in das einheitliche
`ErrorResponse`-Format mit `error.field` normalisiert. Runtime-Readback fuer
Mock und PostgreSQL steht noch aus.

Betroffen:
- `POST /api/chat/knowledge/nodes`
- `POST /api/chat/knowledge/edges`
- `src/routes.rs`
- `src/db.rs`

Fix:
- Required-Checks fuer `type`, `title`, `summary`, `sourceType`, `sourceId`,
  `relation`.
- `confidence` nur `0.0..=1.0`.
- Node-Existenz vor DB-Insert pruefen.
- Self-Edge-Regel festlegen und dokumentieren.

Akzeptanz:
- Leere/ungueltige Payloads liefern `400 bad_request` mit Feld.
- Unbekannte Nodes liefern in Mock und Postgres denselben Fehler.
- Gueltige Node/Edge bleibt nach Reload in `/api/chat/knowledge/graph`.

### 5. Matrix/Synapse-Gate klar entscheiden

Aktueller Stand:
- Matrix-Link-Endpunkte existieren.
- Kein echter Synapse-Client.
- Keine Room-Erstellung gegen Synapse.
- Kein echter `503 matrix_unavailable` Runtime-Pfad.

Option A, realistisch fuer Hackathon:
- Vertrag bleibt Link-only.
- `COMM-MATRIX-001` bleibt `partial`.
- `503` bleibt als geplanter Synapse-Ausfallpfad dokumentiert.

Option B, echter pass:
- Synapse-Service in Compose/Runtime.
- Synapse-Client/Healthcheck im Backend.
- Link/Room-Operationen pruefen Synapse oder legen Raeume an.
- Ausfall liefert reproduzierbar `503 matrix_unavailable`.

Akzeptanz:
- Kein `COMM-MATRIX-001 pass` ohne echten Synapse-Readback.

### 6. Auth/JWT-Gate nicht als fertig behaupten

Aktueller Stand:
- `401 Unauthorized` ist dokumentiert.
- Keine echte JWT/Auth-Middleware runtime-belegt.

Fix:
- Entweder Authentik/JWT-Middleware implementieren und negativ testen.
- Oder API/Evals klar als geplant/partial belassen.

Akzeptanz:
- Ohne/ungueltiger Token liefert reproduzierbar `401`, oder Auth bleibt
  bewusst `partial`.

## P1 Nutzbarkeit Im Modul

### 7. Matrix-Link-Requests validieren

Status: statisch umgesetzt in den Matrix-Link-Routen und in API.md
dokumentiert; echter Synapse-Readback bleibt separates Gate.

Betroffen:
- `POST /api/chat/matrix/users/link`
- `GET /api/chat/matrix/users/:userId`
- `POST /api/chat/matrix/rooms/link`

Fix:
- `matrixUserId`, `matrixRoomId`, `roomAlias` required/format-validieren.
- Einfache Formate:
  - User: `@...:...`
  - Room-ID: `!...:...`
  - Alias optional: `#...:...`

Akzeptanz:
- Leere/falsche Matrix-IDs liefern `400` mit Feld.
- Gueltige Links bleiben nach Reload sichtbar.

### 8. Matrix-User-Anbindung im Frontend ergaenzen

Status: umgesetzt. Die technischen API-Funktionen `linkMatrixUser()` und
`fetchMatrixUser()` sind in der Gruppenansicht angebunden; die sichtbare UI
spricht produktsprachlich von `Chat-User`, nicht vom Protokoll.

Betroffen:
- `frontend/src/services/api.js`
- `frontend/src/App.jsx`
- `frontend/src/components/groups/GroupsSection.jsx` oder eigener
  User-/Identity-Block

Fix umgesetzt:
- Aktiven User aus der Backend-Userliste waehlen.
- Chat-User-Link anzeigen, aber technische Domains fuer Endnutzer abkuerzen.
- Link-/Update-Formular anbieten.
- Backend-Fehler aus `ErrorResponse` inline anzeigen.

Browser-Akzeptanz:
- User waehlen.
- Matrix-ID eintragen.
- Speichern.
- Reload.
- Wert bleibt sichtbar.
- Fehlerfall zeigt Inline-Fehler.

### 9. Feed-Rebuild nutzbar machen

Aktuell im Backend:
- `POST /api/chat/feed/rebuild` validiert `groupId` und antwortet mit
  `accepted_mock`.
- Es gibt noch keinen persistenten Jobstatus und keine echte Queue.

Status: umgesetzt. `rebuildFeed()` ist im Dashboard als echte Backend-Aktion
angebunden.

Betroffen:
- `POST /api/chat/feed/rebuild`
- `frontend/src/components/dashboard/DashboardSection.jsx`
- optional `frontend/src/components/ai-feed/AIFeedPanel.jsx`

Fix umgesetzt:
- Button `Feed neu bauen`.
- Scope/`groupId`, Loading-State, Fehler-State.
- Danach Dashboard refreshen.

Akzeptanz:
- Klick fuehrt echten Request aus.
- Button ist waehrenddessen disabled.
- Liste/Zahlen werden ohne Seitenreload aktualisiert.
- Wenn Backend-Rebuild nur Mock/No-op bleibt, API.md sagt das ehrlich.

### 10. Agent-Analyze-Quelle validieren

Status: Backend-validierung ist statisch umgesetzt; UI darf sie spaeter nicht
mit hart codierten Quellen umgehen.

Betroffen:
- `POST /api/chat/agent/analyze`
- `src/routes.rs`
- `src/db.rs`
- `frontend/src/components/ai-feed/AIFeedPanel.jsx`

Fix:
- Erlaubte `sourceType` definieren.
- `sourceId` je Typ pruefen.
- `mode` nur bekannte Werte oder optional.
- UI darf keine hart codierte Quelle wie `thread-matrix-link` senden.

Akzeptanz:
- Unbekannte Quelle wird abgelehnt.
- Existierender Thread/Wiki/Feed-Item erzeugt Agent-Item.
- Item erscheint in `/api/chat/agent/feed`.

### 11. Gruppen-Erstellung vollstaendig machen

Betroffen:
- `frontend/src/components/groups/AddGroupModal.jsx`
- `frontend/src/components/layout/Sidebar.jsx`

Problem:
- Modal erlaubt nur Name; Beschreibung wird hart gesetzt.

Fix:
- Beschreibung als Feld.
- Duplicate-/Validation-Feedback sichtbar.

Browser-Akzeptanz:
- Gruppe mit Name und Beschreibung erstellen.
- Gruppe erscheint in Sidebar, Gruppenansicht und Chat-Auswahl.
- Leere/duplizierte Namen zeigen Fehler.

### 12. Chat-Kontext aus Backend statt statisch

Betroffen:
- `frontend/src/components/chat/ChatSection.jsx`
- `GET /api/chat/matrix/rooms?groupId=...`
- optional `GET /api/chat/agent/feed?groupId=...`

Status: teilweise umgesetzt. Die statische Aussage `Matrix verbunden` wurde
entfernt; die UI zeigt `Chat-Link konfiguriert/fehlt` und keine sichtbaren
Protokollbegriffe in den geprueften Dashboard-/Gruppen-Views.

Offen:
- Rechte Kontextspalte noch weiter mit echten Raum-/Agent-/Feed-Hinweisen
  ausbauen.

Browser-Akzeptanz:
- Gruppe wechseln.
- Matrix-Raum/Thread-/Nachrichtenzahlen passen zur Gruppe.
- Leere Zustaende sind neutral.

### 13. Wiki-Verknuepfungen aus Backend statt Mock-Text

Betroffen:
- `frontend/src/components/wiki/WikiSection.jsx`
- `frontend/src/components/network/NetworkSection.jsx`
- `GET /api/chat/knowledge/nodes`
- `GET /api/chat/knowledge/edges`

Fix:
- Artikelbezogene Knowledge-Nodes/Edges anzeigen.
- Keine hart codierten Release-/Protokoll-Beispiele.

Akzeptanz:
- Artikel wechseln.
- Verknuepfungen/Metadaten aendern sich artikel- oder gruppenbezogen.

### 14. Dashboard-Items klickbar machen

Betroffen:
- `frontend/src/components/dashboard/DashboardSection.jsx`
- `frontend/src/App.jsx`

Fix:
- Gruppen/Wiki/Feed/Agent-Eintraege aus Dashboard zu konkreten Views routen.
- Ziel-ID ueber Route oder State weitergeben.

Akzeptanz:
- Klick auf Gruppe oeffnet Gruppendetails.
- Klick auf Wiki-Artikel oeffnet Wiki mit Artikel.
- Klick auf Agent-Item oeffnet AI-Feed oder Detail.

## P2 Vertrag, Evals, Doku

### 15. API.md Beispiele vollstaendig machen

Fix:
- Beispiele an echte Models/OpenAPI angleichen.
- Gekuerzte Beispiele klar als gekuerzt markieren.
- Matrix-User-GET muss alle serialisierten Felder erklaeren, z.B. `id`,
  `linkedAt`.

Akzeptanz:
- `API.md` widerspricht `/openapi.json` nicht.
- Request-/Response-Felder sind fuer andere Teams anbindbar.

### 16. Dashboard-Statuswerte als Vertrag dokumentieren

Aktueller guter Stand:
- `database`: `mock` oder `postgres`
- `matrix`: `link_configured` oder `not_configured`

Fix:
- Statuswerte als stabile Enum-Werte in API.md/Evals dokumentieren.
- `link_configured` darf nie als Synapse-`pass` gewertet werden.

### 17. Evals nur mit frischer Evidence hochstufen

Darf ohne weitere Runtime nicht `pass` werden:
- `COMM-DATA-001`
- `COMM-SEED-001`
- `COMM-MATRIX-001`
- `COMM-DEP-001`
- `COMM-SUBMIT-001`

Kann nach Server-Readback Richtung `pass`:
- `COMM-RUN-001`
- `COMM-KG-001`
- `COMM-AGENT-001`
- `COMM-USER-001`

Nur wenn belegt:
- Docker/Compose-Up
- Postgres healthy
- Migration/Seed-Readback
- Server-HTTP-Readbacks
- Gateway/Traefik-Readback

## P3 Design-Spur Spaeter

Design-Vorlage:
- `docs/team-1/design-reference/README.md`
- `docs/team-1/design-reference/codex-base/frontend/src/styles/app.css`
- `docs/team-1/design-reference/codex-base/frontend/src/App.jsx`
- `docs/team-1/design-reference/codex-base/frontend/src/components/views.jsx`

Regel:
- Jetzt keine halbe Design-Umstellung.
- Erst Modul/Backend/Anbindbarkeit fertig machen.
- Danach eigene Frontend-Design-Spur: Shell, Detail-Rails, Status-Strips,
  kompakte Panels, Icons/Farben aus Referenz.

## Abschlusschecks Vor Commit/Push

Lokal:
```bash
git status --short --branch
cargo fmt --check
cargo test --locked
npm --prefix frontend run lint
npm --prefix frontend run build
npm run check
jq empty evals/team-1-kommunikation.json
git diff --check
```

Server:
```bash
ssh david@192.168.2.250 'hostname; docker --version; docker compose version'
ssh david@192.168.2.250 'cd <SERVER_REPO> && docker compose config --quiet'
ssh david@192.168.2.250 'cd <SERVER_REPO> && docker compose build'
ssh david@192.168.2.250 'cd <SERVER_REPO> && docker compose up -d'
ssh david@192.168.2.250 'cd <SERVER_REPO> && docker compose ps'
ssh david@192.168.2.250 'curl -fsS http://127.0.0.1:8001/health'
ssh david@192.168.2.250 'curl -fsS http://127.0.0.1:8001/api/chat'
ssh david@192.168.2.250 'curl -fsS http://127.0.0.1:8001/openapi.json'
ssh david@192.168.2.250 'curl -fsS http://127.0.0.1:8001/api/chat/dashboard'
```

Browser:
- Dashboard zeigt Backenddaten.
- Chat zeigt Backendnachrichten.
- Neue Message persistiert.
- Wiki Create/Update persistiert.
- Gruppe, Member und Matrix-Link persistieren.
- Knowledge Node/Edge persistieren.
- AI Analyze/Feedback persistiert.
- DOM: keine verschachtelten Buttons.

Git/GitHub:
- Vor Push Remote pruefen.
- Nur passende Dateien stagen.
- Keine Secrets, `.env`, `.codex`, `node_modules`, `target`, `frontend/dist`,
  Caches oder lokale Build-Ausgaben.
- Push nur auf `communication codex/team1-communication-api`.
- PR #5 bleibt Draft.
