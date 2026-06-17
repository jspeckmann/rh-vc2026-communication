# Team 1 Modul: Kommunikation Und Wissen

Stand: 2026-06-17

## Kurzfassung

Team 1 baut das Modul `Kommunikation`. Es ist die Kommunikations- und
Wissensschicht der CPP/OpenBoard-App: Personen und Gruppen koennen sich
organisieren, Diskussionen fuehren, Entscheidungen festhalten und Wissen in
einem Wiki beziehungsweise einer Knowledge Base sammeln.

Submit-Ziel ist ein laufendes Modul, nicht nur Architektur-Doku. Das Modul
liefert im Zielbild eine eigene API, eine Datenbank, einen Matrix-Chat-Service,
einen Knowledge Graph, ein einfaches Dashboard und einen LLM-basierten
Agent-Layer.

Aktueller Spur-D-Stand: Statisch sichtbar sind API-/OpenAPI-Codepfade,
PostgreSQL-Migrationen, Mock-State und Matrix-Link-Endpunkte. Nicht frisch
belegt sind echte PostgreSQL-Runtime, Docker/Compose-Up, Synapse-Service,
Auth/401-Middleware, Matrix-503-Ausfallpfad und Browser-/HTTP-Readback.

Alle wichtigen Fachwoerter werden in
`docs/team-1/glossary.md` einfach erklaert. Wenn ein Begriff im
Team unklar ist, zuerst dort nachsehen und danach gezielt eine Informatik-Person
fragen.

Die konkrete DB-Entscheidung steht in `docs/team-1/database.md`. Die
Implementierungsreihenfolge steht in `docs/team-1/roadmap.md`. Die
Submit-Pruefung steht in `docs/team-1/evals.md`.

## Verbindliche Team-Konventionen

Quelle: <https://github.com/noLXXIII/VibeCodedAdministration/blob/main/docs/TEAM-CONVENTIONS.md>

- Modulname: Kommunikation
- Team: 1
- Frontend-Route: `/chat`
- Backend-Traefik-Route: `/api/chat`
- Port: `8001`
- Datenformat: REST ueber JSON
- Pflicht-Healthcheck: `GET /health` mit Body `{"status":"ok"}`
- API-Dokumentation: `GET /openapi.json` oder `API.md`
- Containerisierung: eigenes `Dockerfile`
- Compose-Service mit Traefik-Labels:
  - `traefik.enable=true`
  - `traefik.http.routers.<team>.rule=PathPrefix(`/api/chat`)`
  - `traefik.http.services.<team>.loadbalancer.server.port=8001`
- Das zentrale Frontend spricht Backends ueber `/api/<route>` an und nicht
  direkt ueber den Container-Port.
- Auth: JWT ueber Authentik ist vorgesehen; genaue Token-Details kommen von
  Team 3/5 und bleiben bis dahin Platzhalter.
- Optionaler Admin-Bereich: innerhalb des Moduls unter `/chat/admin`, kein
  separater Service.

## Stack-Entscheidung

Empfohlener Stack fuer die Umsetzung:

- API: Rust mit Axum, weil der Backend-Kern damit typsicher, schnell und
  wartbar bleibt.
- API-Doku: `utoipa` fuer `/openapi.json`; falls das im Hackathon zu viel
  kostet, bleibt `API.md` der verbindliche Vertrag.
- DB-Zugriff: SQLx fuer PostgreSQL, weil echte SQL-Queries sichtbar bleiben und
  sich gut mit Migrationen pruefen lassen.
- Datenbank: PostgreSQL, weil Gruppen, Wiki, Feed, Agent-Daten und Knowledge
  Graph sauber relational und mit JSONB-Erweiterungen modellierbar sind.
- Chat: Matrix/Synapse als Ziel-Service. Matrix ist Pflicht fuer einen
  vollstaendigen Submit-`pass`, aber aktuell ist nur Matrix-Linking im Modul
  belegt; echter Synapse-Start braucht Runtime-Evidence.
- LLM: externer LLM-Provider per API-Key aus Umgebungsvariablen.
- Userintegration: zuerst Dummy-Useradapter mit Mock-Daten; spaeter Austausch
  gegen den Endpoint des User-Moduls.
- UI/Graph-Visualisierung: Web-Frontend mit Cytoscape.js oder vergleichbarer
  JS-Bibliothek im zentralen Frontend; kein Rust-WASM als Pflicht fuer den
  Hackathon.

Matrix ist Chat-Infrastruktur, aber nicht alleinige Datenwahrheit. Die eigene
PostgreSQL-Datenbank bleibt Wahrheit fuer Gruppen, Wiki, Knowledge Graph,
Agent-Auswertungen, Feed und Integrationslinks.

Einfache Empfehlung:

- Rust/Axum fuer die API nehmen, weil es fuer den Backend-Kern sinnvoll ist.
- `utoipa` fuer OpenAPI nutzen, aber `API.md` als sicheren Fallback behalten.
- PostgreSQL nehmen, weil ihr eine echte Datenbank und spaeter agent-lesbare
  Daten wollt.
- SQLx statt ORM-Magie nutzen, damit Schema und Queries nachvollziehbar bleiben.
- Matrix/Synapse als Chat-Service neben dem eigenen Modul einplanen; bis zum
  echten Synapse-Readback Matrix-Link-Endpunkte nicht als Synapse-Service
  ausgeben.
- LLM zuerst mit Mock/Fallback bauen, damit Tests auch ohne echten API-Key
  funktionieren.
- Bei Matrix, Traefik, Docker Compose, Datenbankschema und Authentik jemanden
  aus der Informatik-Gruppe gegenlesen lassen.

## Modulgrenze

Gehort rein:

- Gruppen erstellen und anzeigen
- Personen beziehungsweise User-Referenzen Gruppen zuordnen
- Matrix-Raeume fuer Gruppenkommunikation anlegen oder verknuepfen
- Diskussionen, Fragen und Entscheidungen verwalten
- Nachrichten ueber Matrix fuehren und im eigenen Feed referenzieren
- Wiki-/Knowledge-Base-Artikel erstellen, anzeigen und bearbeiten
- Tags und Autoren an Wiki-Artikel haengen
- Knowledge Graph mit Nodes und Edges fuer Personen, Gruppen, Themen,
  Entscheidungen, Threads und Wiki-Artikel
- Dashboard fuer Gruppenfeed, Wiki, Knowledge Graph und Agent-Feed
- LLM-Agent fuer Zusammenfassungen, Task-Listen, Message-Priorisierung,
  Risiken, naechste Schritte und weitere nuetzliche Feed-Elemente
- Dummy-Useradapter, bis das User-Modul seinen Endpoint liefert
- optionaler Admin-/Moderationsbereich fuer Inhalte

Gehort nicht rein:

- eigene zentrale Auth bauen
- vollstaendiges Rechtesystem
- komplexe Volltextsuche
- eigenes separates Admin-Service
- Matrix als Ersatz fuer das User-Modul
- LLM-API-Key im Repo oder in der Doku speichern

## Architektur

```text
/chat Modul Zielbild
├─ Rust/Axum API
│  ├─ Groups
│  ├─ Matrix Links
│  ├─ Threads / Feed
│  ├─ Wiki / Knowledge Base
│  ├─ Knowledge Graph
│  ├─ Agent Feed
│  └─ Dashboard
├─ PostgreSQL
│  ├─ users_cache
│  ├─ groups
│  ├─ group_members
│  ├─ threads
│  ├─ messages_cache
│  ├─ wiki_articles
│  ├─ feed_items
│  ├─ knowledge_nodes
│  ├─ knowledge_edges
│  ├─ agent_feed_items
│  ├─ agent_feedback
│  ├─ matrix_user_links
│  ├─ matrix_room_links
│  └─ matrix_event_links
├─ Matrix/Synapse (Submit-Gate, aktuell nicht frisch belegt)
│  ├─ Chat-User
│  ├─ Raeume
│  └─ Events
├─ User Adapter
│  └─ Dummy jetzt, echter User-Endpunkt spaeter
└─ LLM Adapter
   └─ API-Key per ENV
```

## Kernobjekte

### UserRef

- `id`
- `displayName`
- `role`

### Group

- `id`
- `name`
- `description`
- `memberIds`
- `createdAt`

### Thread

- `id`
- `groupId`
- `title`
- `type`: `discussion`, `question`, `decision`
- `createdBy`
- `createdAt`

### Message

- `id`
- `threadId`
- `matrixRoomId`
- `matrixEventId`
- `authorId`
- `body`
- `priorityLabel`
- `priorityScore`
- `createdAt`

Hinweis: `Message` meint im eigenen Modul nur relevante Nachrichten oder
Nachrichten-Referenzen. Matrix bleibt der Roh-Chat-Verlauf.

### WikiArticle

- `id`
- `groupId`
- `title`
- `body`
- `tags`
- `authorId`
- `createdAt`
- `updatedAt`

### FeedItem

- `id`
- `groupId`
- `sourceType`: `matrix_message`, `thread`, `wiki_article`, `agent_feed_item`
- `sourceId`
- `title`
- `summary`
- `priority`
- `createdAt`

### KnowledgeNode

- `id`
- `type`: `person`, `group`, `topic`, `decision`, `wiki_article`, `thread`,
  `agent_item`
- `title`
- `summary`
- `sourceType`
- `sourceId`

### KnowledgeEdge

- `id`
- `fromNodeId`
- `toNodeId`
- `relation`: `member_of`, `discussed_in`, `decided_by`, `references`, `owns`,
  `related_to`, `created_by_agent`
- `confidence`

### AgentFeedItem

- `id`
- `groupId`
- `itemType`: `summary`, `task_list`, `message_priority`, `decision_digest`,
  `wiki_seed`, `risk`, `next_steps`
- `title`
- `content`
- `sourceType`: `message`, `thread`, `wiki_article`, `feed_item`
- `sourceId`
- `priority`
- `confidence`
- `status`: `new`, `seen`, `archived`
- `createdAt`

Wichtig: Der Agent nutzt keinen klassischen Freigabe-Workflow. Er schreibt
eigene Feed-Elemente. Beispiele sind Task-Listen, priorisierte Nachrichten,
Zusammenfassungen, Risiken oder naechste Schritte.

### AgentFeedback

- `id`
- `agentFeedItemId`
- `userId`
- `value`: `1` fuer Daumen hoch, `-1` fuer Daumen runter
- `reason`
- `createdAt`

### MatrixEventLink

- `id`
- `matrixRoomLinkId`
- `matrixEventId`
- `sourceType`: `message_cache`, `feed_item`, `thread`
- `sourceId`
- `createdAt`

### MatrixUserLink

- `id`
- `userId`
- `matrixUserId`
- `linkedAt`

### MatrixRoomLink

- `id`
- `groupId`
- `matrixRoomId`
- `createdAt`

## API-Entwurf

Der detaillierte REST-/JSON-Vertrag mit Beispiel-Requests und Responses steht
in `API.md`.

Pflicht:

- `GET /health`
- `GET /openapi.json` oder Dokumentation in `API.md`

Gruppen:

- `GET /api/chat/groups`
- `POST /api/chat/groups`
- `GET /api/chat/groups/:id`
- `POST /api/chat/groups/:id/members`

Diskussionen und Nachrichten:

- `GET /api/chat/threads?groupId=...`
- `POST /api/chat/threads`
- `GET /api/chat/threads/:id/messages`
- `POST /api/chat/threads/:id/messages`

Matrix:

- `POST /api/chat/matrix/users/link`
- `GET /api/chat/matrix/users/:userId`
- `POST /api/chat/matrix/rooms/link`
- `GET /api/chat/matrix/rooms?groupId=...`

Wiki / Knowledge Base:

- `GET /api/chat/wiki`
- `POST /api/chat/wiki`
- `GET /api/chat/wiki/:id`
- `PUT /api/chat/wiki/:id`

Feed:

- `GET /api/chat/feed?groupId=...`
- `POST /api/chat/feed/rebuild`

Knowledge Graph:

- `GET /api/chat/knowledge/nodes`
- `POST /api/chat/knowledge/nodes`
- `GET /api/chat/knowledge/edges`
- `POST /api/chat/knowledge/edges`
- `GET /api/chat/knowledge/graph`

Agent:

- `POST /api/chat/agent/analyze`
- `GET /api/chat/agent/feed`
- `GET /api/chat/agent/feed/:id`
- `POST /api/chat/agent/feed/:id/feedback`

Dashboard:

- `GET /api/chat/dashboard`

User-Dummy:

- `GET /api/chat/users`
- `GET /api/chat/users/:id`

Optional:

- `GET /api/chat/admin`

## Integrationsvertrag

Andere Teams sollen das Modul ueber REST/JSON integrieren koennen. Dafuer
liefert Team 1:

- klare Route und Port-Konvention: `/chat`, `8001`
- Healthcheck fuer Gateway/Monitoring
- API-Dokumentation mit Request-/Response-Beispielen
- Datenmodell fuer Gruppen, Matrix-Links, Diskussionen, Nachrichten, Wiki,
  Feed, Agent-Feed, Agent-Feedback und Knowledge Graph
- Dockerfile und Compose-Service-Snippet mit Traefik-Labels
- Matrix-Link-Endpunkte aktuell; Matrix/Synapse als eigener Docker-Service erst
  bei frischem Compose-/Runtime-Readback als umgesetzt markieren
- PostgreSQL als eigener DB-Service
- LLM-Konfiguration per ENV, ohne Secrets im Repo
- Dummy-Useradapter, der spaeter gegen das User-Modul getauscht wird
- Auth-Platzhalter, bis Team 3/5 JWT-Details finalisiert

## Erfolgskriterien

Das Modul ist submitbereit, wenn:

1. Modulgrenze und Nicht-Ziele dokumentiert sind.
2. Kernobjekte und Felder feststehen.
3. API-Endpunkte mit JSON-Vertrag beschrieben sind.
4. Healthcheck, Dockerfile und Route/Port-Konvention umgesetzt sind.
5. PostgreSQL laeuft mit initialem Schema.
6. Matrix/Synapse laeuft als eigener Docker-Service, ist frisch belegt und mit
   Gruppen/Usern verlinkbar.
7. Knowledge Graph ist per API und Dashboard-Daten abrufbar.
8. LLM-Agent laeuft per ENV-Konfiguration und erzeugt Agent-Feed-Elemente mit
   Daumen-hoch/-runter-Feedback.
9. Dummy-Useradapter funktioniert und ist klar austauschbar.
10. Auth-Abhaengigkeit zu Team 3/5 klar als Platzhalter markiert ist.
11. Andere Teams wissen, wie sie Kommunikation, Matrix, Knowledge Base,
    Dashboard und Agent-Layer anbinden.

## Punkte Fuer Informatiker-Check

Diese Punkte sollte eine technisch sichere Person vor Submit pruefen:

- Ob Synapse als Matrix-Service im Docker Compose wirklich startet.
- Ob Port `8001`, Frontend-Route `/chat`, Backend-Route `/api/chat` und
  Traefik-Labels zu Team 3 passen.
- Ob PostgreSQL-Schema und Testdaten beim Start automatisch angelegt werden.
- Ob `docs/team-1/database.md` zum finalen Backend-Stack passt.
- Ob `/openapi.json` erreichbar ist.
- Ob LLM-Key nur ueber Umgebungsvariablen kommt und nicht im Repo steht.
- Ob der Dummy-Useradapter spaeter leicht gegen den echten User-Endpunkt
  austauschbar ist.
