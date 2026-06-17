# Projektkontext

Stand: 2026-06-17

## Aktuelle Arbeitswahrheit

David ist heute in Team 1. Sein Part ist Architektur, nicht Frontend. Eine
andere Person arbeitet am Design des Moduls.

Team 1 baut das Modul `Kommunikation`:

- Frontend-Route: `/chat`
- Backend-API-Basis ueber Gateway: `/api/chat`
- Lokale Dev-Aliasroute im Axum-Service: `/chat`
- Port: `8001`
- REST ueber JSON
- Backend-Stack: Rust/Axum empfohlen; SQLx fuer PostgreSQL; OpenAPI via
  `utoipa` oder `API.md`
- Healthcheck: `GET /health` mit `{"status":"ok"}`
- API-Doku: `GET /openapi.json` oder `API.md`
- Dockerfile und Compose-/Traefik-Anbindung
- Frontend wird zentral verwaltet; dieses Repo liefert Backend und
  API-/UI-Vertragsdoku fuer `/chat`.
- Authentik/JWT wird durch Team 3/5 final geklaert

Inhaltlich umfasst das Modul Kommunikation zwischen Personen und Gruppen sowie
Wiki/Knowledge Base.

DB-Entscheidung:

- PostgreSQL bleibt Modul-Wahrheit fuer Gruppen, Wiki, Feed, Knowledge Graph,
  Agent-Feed, Feedback und Matrix-Links.
- Matrix/Synapse ist Chat-Layer und speichert rohe Chat-Events.
- `messages_cache` speichert nur app-relevante Nachrichten oder Referenzen,
  nicht den kompletten Matrix-Verlauf.
- `matrix_event_links` gehoert ins Submit-Schema.
- Der LLM-Agent erzeugt Agent-Feed-Elemente wie Task-Listen,
  Message-Priorisierung, Zusammenfassungen, Risiken und naechste Schritte.
- Feedback auf Agent-Feed-Elemente laeuft per Daumen hoch/runter.

## Massgebliche Dateien

- `docs/team-1/index.md`: Startpunkt und Lesereihenfolge fuer Team 1
- `docs/team-1/architecture.md`: Modularchitektur und Integrationsvertrag
- `API.md`: REST-/JSON-Vertrag mit Beispiel-Requests, Responses und
  Fehlerformaten
- `docs/team-1/database.md`: Datenbankentscheidung, Tabellen, Seed-Daten,
  ENV-Variablen und Submit-Gates
- `docs/team-1/roadmap.md`: Reihenfolge von Fragen, Implementierung und Gates
- `docs/team-1/evals.md`: Klartext-Evals vor Submit/Uebergabe
- `evals/team-1-kommunikation.json`: maschinenlesbare Eval-Struktur
- `docs/team-1/group-notes.md`: Team-1-Rolle und Notizen

## GitHub-Kontext

David ist im aktuellen Gruppen-GitHub-Projekt eingeladen beziehungsweise hat
Zugriff auf das neueste Gruppenprojekt. Die genaue Repo-URL oder der
Repository-Name ist noch offen und sollte nachgetragen werden, sobald bekannt.

## Modulgrenze

Gehort rein:

- Gruppen erstellen und anzeigen
- User-Referenzen Gruppen zuordnen
- Matrix-Raeume mit Gruppen verknuepfen
- Diskussionen, Fragen und Entscheidungen
- Nachrichten in Diskussionen
- Wiki-/Knowledge-Base-Artikel
- Feed, Knowledge Graph und Agent-Feed
- optionaler Admin-/Moderationsbereich unter `/chat/admin`

Gehort nicht rein:

- eigene zentrale Auth
- vollstaendiges Rechtesystem
- selbstgebauter Echtzeit-Chat statt Matrix
- komplexe Volltextsuche
- automatische KI-Aenderungen ohne Feedback-/Kontrollweg
- separates Admin-Service

## Kernobjekte

- `UserRef`
- `Group`
- `Thread`
- `Message`
- `WikiArticle`
- `FeedItem`
- `KnowledgeNode`
- `KnowledgeEdge`
- `AgentFeedItem`
- `AgentFeedback`
- `MatrixUserLink`
- `MatrixRoomLink`
- `MatrixEventLink`

## Offene externe Abhaengigkeiten

- finale JWT-/Authentik-Details von Team 3/5
- Gateway-Registrierung in `modules.json`
- finaler API-Doku-Mechanismus: `/openapi.json` oder `API.md`

## Hintergrund / Alt-Kontext

Die aelteren OpenBoard-Dateien beschreiben die urspruengliche Produktidee und
Demo-Planung. Sie liegen unter `docs/archive/openboard-mvp/` und sind nur
Hintergrund. Die aktuelle Arbeitswahrheit ist das Team-1-Modul
`Kommunikation`.
