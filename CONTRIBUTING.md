# Contributing: Team 1 Kommunikation

Stand: 2026-06-17

## Zweck

Diese Datei definiert, welche Beitraege fuer das Team-1-Modul
`Kommunikation` angenommen werden. Sie gilt fuer Doku, API, Backend,
Demo-Daten, Docker/Compose und Submit-Readbacks.

Grundregel:

> Doku-`pass` ersetzt keinen Runtime-`pass`.

Ein Beitrag ist erst submitfaehig, wenn er entweder lokal/mockbar belegt ist
oder eine externe Abhaengigkeit mit Owner, Frage, Fallback und Blocker-Status
markiert.

## Vor Dem Start Lesen

Massgebliche Reihenfolge:

1. `docs/project-context.md`
2. `docs/team-1/index.md`
3. `docs/team-1/architecture.md`
4. `API.md`
5. `docs/team-1/database.md`
6. `docs/team-1/roadmap.md`
7. `docs/team-1/evals.md`
8. `evals/team-1-kommunikation.json`

Alte OpenBoard-/MVP-Dateien unter `docs/archive/openboard-mvp/` sind nur
Hintergrund und duerfen nicht als aktuelle Projektwahrheit behandelt werden.

## Muss-Regeln

- Modulname: `Kommunikation`
- Frontend-Route: `/chat`
- Backend-API-Basis ueber Gateway: `/api/chat`
- Lokale Dev-Aliasroute im Axum-Service: `/chat`
- Port: `8001`
- Format: REST ueber JSON
- Healthcheck: `GET /health` mit `{"status":"ok"}`
- API-Doku: `GET /openapi.json` oder `API.md`
- PostgreSQL ist Modul-Wahrheit fuer Gruppen, Wiki, Feed, Knowledge Graph,
  Agent-Feed, Feedback und Matrix-Links.
- Matrix/Synapse ist Chat-Layer und speichert rohe Chat-Events.
- `messages_cache` speichert nur app-relevante Nachrichten oder Referenzen,
  nie den kompletten Matrix-Verlauf.
- `matrix_event_links` gehoert ins Submit-Schema.
- Agent-Feed nutzt Daumen-hoch/-runter-Feedback, keine alte
  Accept/Reject-Vorschlagslogik.
- Dummy-Useradapter muss lokal funktionieren, bis Team 5 den echten User-
  Endpunkt liefert.

## Ohne Nachfrage Aendern

Diese Arbeiten sind freigegeben, wenn sie den bestehenden Dokus entsprechen:

- `/api/chat`, Frontend-Route `/chat`, Port `8001`, REST/JSON
- `GET /health`
- API.md/OpenAPI-Vertrag
- PostgreSQL-Schema nach `docs/team-1/database.md`
- Seed-Daten
- Dummy-Useradapter
- Mock-LLM und Agent-Feed
- Daumen-hoch/-runter-Feedback
- Knowledge Graph und Dashboard aus Demo-Daten
- `.env.example` nur mit Platzhaltern

## Vorher Gegenchecken

Diese Punkte duerfen nicht still final entschieden werden:

- echte JWT-Felder, Issuer, Rollen und Admin-Rechte
- echter Usermodul-Endpunkt und stabile User-ID
- Synapse-Strategie: Raeume selbst anlegen oder vorhandene Raeume verlinken
- Gateway/Traefik und `modules.json`
- ob `/openapi.json` zwingend live sein muss oder `API.md` reicht
- ob Team 4 Agent-Task-Listen spaeter importieren soll
- finaler LLM-Provider und ENV-Namen

Wenn eine externe Antwort fehlt, den Beitrag nicht blockierend stehen lassen,
sondern Owner, Frage, Fallback und Blocker-Status dokumentieren.

## Submit-Minimum

Vor Submit muessen diese Endpunkte praktisch pruefbar sein:

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
Agenten lokal funktionieren.

## Seed- Und Demo-Daten

Hauptansichten duerfen nicht leer starten. Minimum:

- mindestens 3 Dummy-User
- mindestens 2 Gruppen
- mindestens 1 Diskussion, 1 Frage und 1 Entscheidung
- mindestens 2 Wiki-Artikel mit Tags
- mindestens 3 Feed-Eintraege
- mindestens 5 Knowledge-Nodes und 5 Knowledge-Edges
- mindestens 3 Agent-Feed-Items
- mindestens 2 Agent-Feedback-Beispiele

## Evidence Fuer Annahme

Jeder `pass` braucht Beleg:

- Doku-Checks: Datei und Abschnitt
- Runtime-Checks: Kommando oder API-Readback
- Integrationen: Owner, Frage, Fallback und Blocker-Status

Eine Behauptung wie "sollte laufen" reicht nicht. Wenn etwas noch nicht
geprueft wurde, bleibt es `partial` oder `not_checked`.

## Wird Abgelehnt

Ein Submit wird nicht angenommen, wenn:

- Route, Port, Healthcheck oder JSON-Vertrag von den Team-Konventionen
  abweichen.
- API-Vertrag, DB-Plan und Implementierung einander widersprechen.
- Matrix als alleinige Datenwahrheit behandelt wird.
- `messages_cache` als Vollarchiv aller Matrix-Nachrichten genutzt wird.
- Agent-Feedback fehlt oder der Agent zwingend einen echten LLM-Key braucht.
- Hauptansichten leer starten.
- externe Abhaengigkeiten ohne Owner/Fallback als Blocker liegen bleiben.
- Secrets, Tokens, `.env`, Datenbanken, Uploads, Caches oder Runtime-Ausgaben
  im Repo landen.
- nur Doku existiert, aber kein lauffaehiger Kern nachweisbar ist.

## Nicht Committen

- `.env`
- Secrets, Tokens, API-Keys, Matrix-Tokens, JWTs
- Zertifikate und private Keys
- Datenbanken, Uploads, Caches, Runtime-Ausgaben
- Build-Ausgaben und Tool-Zwischenstaende
- `.codex/skill-runtime-cache.json`

`.codex/NOW.md` und `.codex/TASKS.md` nur committen, wenn Agent-Kontext bewusst
Teil des Repos sein soll.

## Uebergabe / Readback

Jeder Submit sollte kurz enthalten:

- geaenderte Dateien
- was lokal geprueft wurde
- welche Evals dadurch `pass`, `partial` oder `not_checked` sind
- offene externe Abhaengigkeiten mit Owner, Frage, Fallback und Blocker-Status
- naechster sinnvoller Schritt
