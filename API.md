# Team 1 Kommunikation API

Stand: 2026-06-17

## Zweck

Diese Datei ist der REST-/JSON-Vertrag fuer das Team-1-Modul
`Kommunikation`. Sie ist als Submit- und Integrationsdoku gedacht, falls
`/openapi.json` noch nicht final verfuegbar ist.

Statushinweis Spur D: Diese Datei beschreibt Vertrag und statisch gelesene
Codepfade. Ohne frischen Serverlauf gilt kein Beispiel als Runtime-Readback.
Aktuell statisch belegt sind Matrix-Link-Routen und Vertragsbeispiele, nicht ein
echter Synapse-Service.

Basis:

- Frontend-Route: `/chat`
- Backend-API-Basis ueber Gateway: `/api/chat`
- Lokale Dev-Aliasroute im Axum-Service: `/chat`
- Modulport: `8001`
- Healthcheck: `GET /health`
- Datenformat: JSON
- Auth: spaeter JWT via Authentik; lokal darf Mock/Auth-Off genutzt werden
- Userquelle: zuerst Dummy-Useradapter, spaeter echtes Usermodul
- DB-Wahrheit: PostgreSQL
- Chat-Layer: Matrix/Synapse als Zielbild; aktuell API-seitig Matrix-User- und
  Matrix-Room-Linking

Umsetzungsreihenfolge: `docs/team-1/roadmap.md`.
Submit-Pruefung: `docs/team-1/evals.md`.

## Gemeinsame Regeln

Alle Requests mit Body senden:

```http
Content-Type: application/json
```

Spaeter bei aktivierter Auth:

```http
Authorization: Bearer <jwt>
```

IDs in Beispielen sind Demo-IDs. Im echten Backend koennen UUIDs oder
vergleichbare eindeutige IDs genutzt werden. Das zentrale Frontend spricht das
Backend laut Team-Konventionen ueber `/api/chat`; direkte Port-Zugriffe sind
nur fuer lokale Entwicklung gedacht.

Hinweis zu Beispielen: Einige lange Dashboard-, Matrix- und Graph-Beispiele
sind zur Lesbarkeit gekuerzt. Bis `/openapi.json` frisch runtime-belegt ist,
ist diese API.md der Doku-Vertrag; danach gilt `/openapi.json` zusammen mit den
Modellen in `src/models.rs` als serialisierter Vertrag.

## Fehlerformat

### `400 Bad Request`

```json
{
  "error": {
    "code": "bad_request",
    "message": "groupId ist erforderlich",
    "field": "groupId"
  }
}
```

### `401 Unauthorized`

Status: geplant fuer die spaetere Authentik/JWT-Middleware. Ohne Team-3/5-
Claims und frischen Middleware-Readback ist `401` kein Runtime-pass.

```json
{
  "error": {
    "code": "unauthorized",
    "message": "JWT fehlt oder ist ungueltig"
  }
}
```

Hinweis: Solange Authentik/JWT von Team 3/5 nicht final ist, darf lokal ein
Mock-Modus genutzt werden.

### `404 Not Found`

```json
{
  "error": {
    "code": "not_found",
    "message": "Gruppe wurde nicht gefunden"
  }
}
```

### `503 Service Unavailable`

Status: geplant fuer echten Matrix/Synapse-Ausfall. Der Code enthaelt ein
`matrix_unavailable`-Fehlerformat, aber die aktuellen Matrix-Link-Endpunkte
belegen noch keinen Synapse-Service und keinen reproduzierten 503-Pfad.

```json
{
  "error": {
    "code": "matrix_unavailable",
    "message": "Matrix ist aktuell nicht erreichbar"
  }
}
```

## Health

### `GET /health`

Response `200`:

```json
{
  "status": "ok"
}
```

## Modulindex

### `GET /api/chat`

Response `200`:

```json
{
  "module": "Kommunikation",
  "frontendRoute": "/chat",
  "apiBasePath": "/api/chat",
  "localDevAlias": "/chat",
  "docs": "/openapi.json"
}
```

## Users

### `GET /api/chat/users`

Response `200`:

```json
{
  "users": [
    {
      "id": "user-david",
      "displayName": "David",
      "role": "architect",
      "source": "dummy"
    },
    {
      "id": "user-samira",
      "displayName": "Samira",
      "role": "backend",
      "source": "dummy"
    }
  ]
}
```

### `GET /api/chat/users/:id`

Response `200`:

```json
{
  "id": "user-david",
  "displayName": "David",
  "role": "architect",
  "source": "dummy"
}
```

## Groups

### `GET /api/chat/groups`

Response `200`:

```json
{
  "groups": [
    {
      "id": "group-team-1",
      "name": "Team 1 Kommunikation",
      "description": "Kommunikation, Wissen und Agent-Feed",
      "memberIds": ["user-david", "user-samira"],
      "matrixRoomId": "!team1:matrix.local",
      "createdAt": "2026-06-17T09:00:00Z"
    }
  ]
}
```

### `POST /api/chat/groups`

Request:

```json
{
  "name": "Team 1 Kommunikation",
  "description": "Kommunikation, Wissen und Agent-Feed",
  "createdByUserId": "user-david"
}
```

Validierung:

- `name` ist erforderlich.
- `createdByUserId` ist erforderlich und muss existieren.

Response `201`:

```json
{
  "id": "group-team-1",
  "name": "Team 1 Kommunikation",
  "description": "Kommunikation, Wissen und Agent-Feed",
  "memberIds": ["user-david"],
  "createdAt": "2026-06-17T09:00:00Z"
}
```

### `GET /api/chat/groups/:id`

Response `200`:

```json
{
  "id": "group-team-1",
  "name": "Team 1 Kommunikation",
  "description": "Kommunikation, Wissen und Agent-Feed",
  "members": [
    {
      "userId": "user-david",
      "displayName": "David",
      "memberRole": "owner"
    }
  ],
  "matrixRoom": {
    "matrixRoomId": "!team1:matrix.local",
    "roomAlias": "#team-1-kommunikation:matrix.local",
    "linkStatus": "linked"
  }
}
```

### `POST /api/chat/groups/:id/members`

Request:

```json
{
  "userId": "user-samira",
  "memberRole": "member"
}
```

Validierung:

- `userId` ist erforderlich und muss existieren.
- `memberRole` ist erforderlich und muss `owner` oder `member` sein.

Response `201`:

```json
{
  "groupId": "group-team-1",
  "userId": "user-samira",
  "memberRole": "member",
  "joinedAt": "2026-06-17T09:15:00Z"
}
```

## Threads And Messages

### `GET /api/chat/threads?groupId=group-team-1`

Response `200`:

```json
{
  "threads": [
    {
      "id": "thread-architecture",
      "groupId": "group-team-1",
      "title": "DB-Entscheidung",
      "type": "decision",
      "status": "open",
      "createdBy": "user-david",
      "createdAt": "2026-06-17T09:20:00Z"
    }
  ]
}
```

### `POST /api/chat/threads`

Request:

```json
{
  "groupId": "group-team-1",
  "title": "Matrix-Verknuepfung klaeren",
  "type": "question",
  "createdBy": "user-david"
}
```

Validierung:

- `groupId` ist erforderlich und muss existieren.
- `title` ist erforderlich.
- `type` muss `discussion`, `question` oder `decision` sein.
- `createdBy` ist erforderlich und muss existieren.

Response `201`:

```json
{
  "id": "thread-matrix-link",
  "groupId": "group-team-1",
  "title": "Matrix-Verknuepfung klaeren",
  "type": "question",
  "status": "open",
  "createdBy": "user-david",
  "createdAt": "2026-06-17T09:30:00Z"
}
```

### `GET /api/chat/threads/:id/messages`

Response `200`:

```json
{
  "messages": [
    {
      "id": "msg-1",
      "threadId": "thread-architecture",
      "matrixRoomId": "!team1:matrix.local",
      "matrixEventId": "$event1",
      "authorId": "user-david",
      "body": "PostgreSQL bleibt Modul-Wahrheit, Matrix bleibt Chat-Layer.",
      "priorityLabel": "high",
      "priorityScore": 0.91,
      "createdAt": "2026-06-17T09:25:00Z"
    }
  ]
}
```

### `POST /api/chat/threads/:id/messages`

Request:

```json
{
  "authorId": "user-david",
  "body": "Bitte matrix_event_links ins Schema aufnehmen."
}
```

Validierung:

- Thread-ID im Pfad muss existieren.
- `authorId` ist erforderlich und muss existieren.
- `body` ist erforderlich.

Response `201`:

```json
{
  "id": "msg-2",
  "threadId": "thread-architecture",
  "matrixRoomId": "!team1:matrix.local",
  "matrixEventId": "$event2",
  "authorId": "user-david",
  "body": "Bitte matrix_event_links ins Schema aufnehmen.",
  "priorityLabel": "normal",
  "priorityScore": 0.5,
  "createdAt": "2026-06-17T09:35:00Z"
}
```

Hinweis: `messages_cache` speichert nur relevante Nachrichten oder Referenzen.
Matrix bleibt Roh-Chat-Verlauf.
`matrix_event_links` ist aktuell interne Persistenz fuer Message-/Event-
Referenzen. Solange kein eigener List-/Read-Endpunkt existiert, ist die
Tabelle nicht Teil des oeffentlichen REST-Vertrags.

## Matrix Links

Diese Endpunkte verwalten Links zwischen Modul-Usern/-Gruppen und Matrix-IDs.
Sie legen nach aktuellem Vertrag keine Synapse-Raeume an und beweisen keine
Synapse-Erreichbarkeit.

### `POST /api/chat/matrix/users/link`

Request:

```json
{
  "userId": "user-david",
  "matrixUserId": "@david:matrix.local"
}
```

Validierung:

- `userId` ist erforderlich und muss existieren.
- `matrixUserId` ist erforderlich und muss das Format `@localpart:server`
  haben.

Response `201`:

```json
{
  "id": "mul-1",
  "userId": "user-david",
  "matrixUserId": "@david:matrix.local",
  "linkStatus": "linked",
  "linkedAt": "2026-06-17T09:40:00Z"
}
```

### `GET /api/chat/matrix/users/:userId`

Response `200`:

```json
{
  "id": "mul-1",
  "userId": "user-david",
  "matrixUserId": "@david:matrix.local",
  "linkStatus": "linked",
  "linkedAt": "2026-06-17T09:40:00Z"
}
```

### `POST /api/chat/matrix/rooms/link`

Request:

```json
{
  "groupId": "group-team-1",
  "matrixRoomId": "!team1:matrix.local",
  "roomAlias": "#team-1-kommunikation:matrix.local",
  "isPrimary": true
}
```

Validierung:

- `groupId` ist erforderlich und muss existieren.
- `matrixRoomId` ist erforderlich und muss das Format `!localpart:server`
  haben.
- `roomAlias` ist optional. Wenn gesetzt, muss der Alias das Format
  `#localpart:server` haben.

Response `201`:

```json
{
  "id": "mrl-1",
  "groupId": "group-team-1",
  "matrixRoomId": "!team1:matrix.local",
  "roomAlias": "#team-1-kommunikation:matrix.local",
  "isPrimary": true,
  "linkStatus": "linked",
  "createdAt": "2026-06-17T09:45:00Z"
}
```

### `GET /api/chat/matrix/rooms?groupId=group-team-1`

Response `200`:

```json
{
  "rooms": [
    {
      "id": "mrl-1",
      "groupId": "group-team-1",
      "matrixRoomId": "!team1:matrix.local",
      "roomAlias": "#team-1-kommunikation:matrix.local",
      "isPrimary": true,
      "linkStatus": "linked",
      "createdAt": "2026-06-17T09:45:00Z"
    }
  ]
}
```

## Wiki

### `GET /api/chat/wiki?groupId=group-team-1`

Response `200`:

```json
{
  "articles": [
    {
      "id": "wiki-db-plan",
      "groupId": "group-team-1",
      "title": "DB-Plan Kommunikation",
      "tags": ["db", "matrix", "agent"],
      "authorId": "user-david",
      "updatedAt": "2026-06-17T10:00:00Z"
    }
  ]
}
```

### `POST /api/chat/wiki`

Request:

```json
{
  "groupId": "group-team-1",
  "title": "Matrix und PostgreSQL",
  "body": "Matrix ist Chat-Layer. PostgreSQL bleibt Modul-Wahrheit.",
  "tags": ["matrix", "postgresql"],
  "authorId": "user-david",
  "status": "published"
}
```

Validierung:

- `groupId` ist erforderlich und muss existieren.
- `title` und `body` sind erforderlich.
- `authorId` ist erforderlich und muss existieren.
- `status` ist optional und muss `published`, `draft` oder `archived` sein.

Response `201`:

```json
{
  "id": "wiki-matrix-postgres",
  "groupId": "group-team-1",
  "title": "Matrix und PostgreSQL",
  "body": "Matrix ist Chat-Layer. PostgreSQL bleibt Modul-Wahrheit.",
  "tags": ["matrix", "postgresql"],
  "authorId": "user-david",
  "status": "published",
  "createdAt": "2026-06-17T10:05:00Z",
  "updatedAt": "2026-06-17T10:05:00Z"
}
```

### `GET /api/chat/wiki/:id`

Response `200`:

```json
{
  "id": "wiki-matrix-postgres",
  "groupId": "group-team-1",
  "title": "Matrix und PostgreSQL",
  "body": "Matrix ist Chat-Layer. PostgreSQL bleibt Modul-Wahrheit.",
  "tags": ["matrix", "postgresql"],
  "authorId": "user-david",
  "status": "published",
  "createdAt": "2026-06-17T10:05:00Z",
  "updatedAt": "2026-06-17T10:05:00Z"
}
```

### `PUT /api/chat/wiki/:id`

Request:

```json
{
  "title": "Matrix, PostgreSQL und Agent-Feed",
  "body": "Matrix ist Chat-Layer. PostgreSQL bleibt Modul-Wahrheit. Der Agent schreibt in den Agent-Feed.",
  "tags": ["matrix", "postgresql", "agent"],
  "status": "published"
}
```

Validierung:

- Wiki-ID im Pfad muss existieren.
- `title` und `body` sind erforderlich.
- `status` ist optional und muss `published`, `draft` oder `archived` sein.

Response `200`:

```json
{
  "id": "wiki-matrix-postgres",
  "title": "Matrix, PostgreSQL und Agent-Feed",
  "tags": ["matrix", "postgresql", "agent"],
  "status": "published",
  "updatedAt": "2026-06-17T10:10:00Z"
}
```

## Feed

### `GET /api/chat/feed?groupId=group-team-1`

Response `200`:

```json
{
  "items": [
    {
      "id": "feed-1",
      "groupId": "group-team-1",
      "sourceType": "agent_feed_item",
      "sourceId": "agent-1",
      "title": "Wichtige DB-Entscheidung",
      "summary": "PostgreSQL ist Modul-Wahrheit, Matrix bleibt Chat-Layer.",
      "priority": "high",
      "createdAt": "2026-06-17T10:12:00Z"
    }
  ]
}
```

### `POST /api/chat/feed/rebuild`

Status: Der Endpunkt validiert aktuell `groupId` und nimmt den Rebuild als
Mock/No-op an. Es wird noch kein persistenter Job angelegt und keine echte
Queue betrieben. Ein echter Rebuild-Jobstatus ist ein spaeterer Ausbau.

Request:

```json
{
  "groupId": "group-team-1"
}
```

Response `202`:

```json
{
  "status": "accepted_mock",
  "groupId": "group-team-1"
}
```

## Knowledge Graph

### `GET /api/chat/knowledge/nodes`

Response `200`:

```json
{
  "nodes": [
    {
      "id": "node-group-team-1",
      "type": "group",
      "title": "Team 1 Kommunikation",
      "summary": "Gruppe fuer Kommunikation und Wissen",
      "sourceType": "group",
      "sourceId": "group-team-1"
    }
  ]
}
```

### `POST /api/chat/knowledge/nodes`

Request:

```json
{
  "type": "topic",
  "title": "Matrix-Verknuepfung",
  "summary": "Wie Gruppen und Matrix-Raeume verbunden werden",
  "sourceType": "thread",
  "sourceId": "thread-matrix-link"
}
```

Validierung:

- `type`, `title`, `summary`, `sourceType` und `sourceId` sind erforderlich.
- `type` muss `person`, `group`, `topic`, `decision`, `wiki_article`,
  `thread` oder `agent_item` sein.

Response `201`:

```json
{
  "id": "node-topic-matrix",
  "type": "topic",
  "title": "Matrix-Verknuepfung",
  "summary": "Wie Gruppen und Matrix-Raeume verbunden werden",
  "sourceType": "thread",
  "sourceId": "thread-matrix-link"
}
```

### `GET /api/chat/knowledge/edges`

Response `200`:

```json
{
  "edges": [
    {
      "id": "edge-1",
      "fromNodeId": "node-user-david",
      "toNodeId": "node-group-team-1",
      "relation": "member_of",
      "confidence": 1.0,
      "sourceType": "group",
      "sourceId": "group-team-1"
    }
  ]
}
```

### `POST /api/chat/knowledge/edges`

Request:

```json
{
  "fromNodeId": "node-topic-matrix",
  "toNodeId": "node-wiki-matrix-postgres",
  "relation": "references",
  "confidence": 0.9,
  "sourceType": "wiki_article",
  "sourceId": "wiki-matrix-postgres"
}
```

Validierung:

- `fromNodeId`, `toNodeId`, `relation`, `sourceType` und `sourceId` sind
  erforderlich.
- `fromNodeId` und `toNodeId` muessen existierende Knowledge-Nodes sein.
- Self-Edges sind nicht erlaubt: `fromNodeId` darf nicht gleich `toNodeId`
  sein.
- `relation` muss `member_of`, `discussed_in`, `decided_by`, `references`,
  `owns`, `related_to` oder `created_by_agent` sein.
- `confidence` muss im Bereich `0.0..=1.0` liegen.

Response `201`:

```json
{
  "id": "edge-topic-wiki",
  "fromNodeId": "node-topic-matrix",
  "toNodeId": "node-wiki-matrix-postgres",
  "relation": "references",
  "confidence": 0.9,
  "sourceType": "wiki_article",
  "sourceId": "wiki-matrix-postgres"
}
```

### `GET /api/chat/knowledge/graph`

Response `200`:

```json
{
  "nodes": [
    {
      "id": "node-group-team-1",
      "type": "group",
      "title": "Team 1 Kommunikation",
      "summary": "Gruppe fuer Kommunikation und Wissen",
      "sourceType": "group",
      "sourceId": "group-team-1"
    },
    {
      "id": "node-wiki-matrix-postgres",
      "type": "wiki_article",
      "title": "Matrix und PostgreSQL",
      "summary": "Wiki-Artikel zur Modul-Wahrheit",
      "sourceType": "wiki_article",
      "sourceId": "wiki-matrix-postgres"
    }
  ],
  "edges": [
    {
      "id": "edge-4",
      "fromNodeId": "node-thread-architecture",
      "toNodeId": "node-wiki-matrix-postgres",
      "relation": "references",
      "confidence": 1.0,
      "sourceType": "wiki_article",
      "sourceId": "wiki-matrix-postgres"
    }
  ]
}
```

## Agent Feed

### `POST /api/chat/agent/analyze`

Request:

```json
{
  "groupId": "group-team-1",
  "sourceType": "thread",
  "sourceId": "thread-architecture",
  "mode": "mock"
}
```

Validierung:

- `groupId`, `sourceType` und `sourceId` sind erforderlich.
- `sourceType` muss `thread`, `wiki_article`, `feed_item` oder
  `agent_feed_item` sein.
- `sourceId` muss fuer den angegebenen `sourceType` in derselben `groupId`
  existieren.
- `mode` ist optional. Wenn gesetzt, muss der Wert `mock`, `summary` oder
  `next_steps` sein.

Response `201`:

```json
{
  "createdItems": [
    {
      "id": "agent-123",
      "groupId": "group-team-1",
      "itemType": "next_steps",
      "title": "Mock-Analyse: naechste Schritte",
      "content": {
        "mode": "mock",
        "tasks": [
          "API-Readback dokumentieren",
          "Docker/Synapse als partial markieren",
          "DB-Readback nach Docker-Freigabe nachziehen"
        ]
      },
      "sourceType": "thread",
      "sourceId": "thread-architecture",
      "priority": "normal",
      "confidence": 0.75,
      "status": "new",
      "createdAt": "2026-06-17T10:30:00Z"
    }
  ]
}
```

Ohne LLM-Key darf der Mock/Fallback-Modus Demo-Elemente erzeugen. Mit echtem
Key muss der API-Key per ENV kommen, nie aus dem Repo.

### `GET /api/chat/agent/feed?groupId=group-team-1`

Response `200`:

```json
{
  "items": [
    {
      "id": "agent-1",
      "groupId": "group-team-1",
      "itemType": "task_list",
      "title": "Naechste Schritte DB-Integration",
      "priority": "high",
      "status": "new",
      "feedback": {
        "up": 1,
        "down": 0
      }
    }
  ]
}
```

### `GET /api/chat/agent/feed/:id`

Response `200`:

```json
{
  "id": "agent-1",
  "groupId": "group-team-1",
  "itemType": "task_list",
  "title": "Naechste Schritte DB-Integration",
  "content": {
    "tasks": [
      "PostgreSQL-Service vorbereiten",
      "Schema initialisieren",
      "Matrix-Room-Link testen"
    ]
  },
  "sourceType": "thread",
  "sourceId": "thread-architecture",
  "priority": "high",
  "confidence": 0.84,
  "status": "new",
  "createdAt": "2026-06-17T10:20:00Z",
  "feedback": {
    "up": 1,
    "down": 0
  }
}
```

### `POST /api/chat/agent/feed/:id/feedback`

Request:

```json
{
  "userId": "user-david",
  "value": 1,
  "reason": "Hilft fuer die naechste Umsetzung."
}
```

Validierung:

- Agent-Feed-ID im Pfad muss existieren.
- `userId` ist erforderlich und muss existieren.
- `value` muss `1` oder `-1` sein.

Response `201`:

```json
{
  "id": "feedback-1",
  "agentFeedItemId": "agent-1",
  "userId": "user-david",
  "value": 1,
  "reason": "Hilft fuer die naechste Umsetzung.",
  "createdAt": "2026-06-17T10:25:00Z"
}
```

## Dashboard

### `GET /api/chat/dashboard`

Hinweis: `status.database` soll `mock` oder `postgres` ausdruecken.
`status.matrix` ist aktuell `link_configured` oder `not_configured` und darf
nicht als Synapse-Healthcheck gelesen werden. Fuer einen spaeteren
Submit-`pass` muessen Room-Link-Status und Synapse-Service-Status getrennt
belegbar sein.

Response `200`:

```json
{
  "status": {
    "api": "ok",
    "database": "mock",
    "matrix": "link_configured",
    "llm": "mock",
    "userAdapter": "dummy"
  },
  "groups": [
    {
      "id": "group-team-1",
      "name": "Team 1 Kommunikation"
    }
  ],
  "feed": [
    {
      "id": "feed-1",
      "title": "Wichtige DB-Entscheidung",
      "priority": "high"
    }
  ],
  "wiki": [
    {
      "id": "wiki-matrix-postgres",
      "title": "Matrix und PostgreSQL"
    }
  ],
  "agentFeed": [
    {
      "id": "agent-1",
      "itemType": "task_list",
      "title": "Naechste Schritte DB-Integration",
      "feedback": {
        "up": 1,
        "down": 0
      }
    }
  ],
  "knowledgeGraph": {
    "nodeCount": 6,
    "edgeCount": 5
  }
}
```

## Submit-Minimum

Vor Submit sollten diese Endpunkte praktisch pruefbar sein:

- `GET /health`
- `GET /api/chat/groups`
- `POST /api/chat/groups`
- `GET /api/chat/wiki`
- `GET /api/chat/feed`
- `GET /api/chat/knowledge/graph`
- `POST /api/chat/agent/analyze`
- `GET /api/chat/agent/feed`
- `POST /api/chat/agent/feed/:id/feedback`
- `GET /api/chat/dashboard`

Matrix-, User- und Auth-Details duerfen als vorbereitete Integration
dokumentiert sein, solange Dummy-User, Matrix-Links und Mock/Fallback fuer den
Agenten nicht als frischer Runtime-`pass` behauptet werden.

Fuer Submit-`pass` reicht vorbereitete Integration nicht aus: PostgreSQL,
Synapse, Auth/401, Matrix-503 und Gateway-Readback brauchen frische Evidence.
