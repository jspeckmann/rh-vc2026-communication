# Team 1 Kommunikation: Klartext-Evals

Stand: 2026-06-17

## Zweck

Diese Evals sagen in Klartext, ob das Modul `Kommunikation` nur gut
dokumentiert ist oder wirklich submitbereit laeuft.

Wichtige Regel:

> Doku-`pass` ersetzt keinen Runtime-`pass`.

Ein Punkt darf also nicht als fertig gelten, nur weil er beschrieben ist. Fuer
Submit muss klar sein, was dokumentiert, implementiert, lokal geprueft oder als
externe Abhaengigkeit markiert ist.

## Statuswerte

- `not_checked`: noch nicht bewertet.
- `pass`: Kriterium ist im richtigen Layer erfuellt und belegt.
- `partial`: Richtung stimmt, aber es ist nur dokumentiert, noch nicht geprueft
  oder haengt an einer externen Antwort mit Fallback.
- `fail`: fehlt, widerspricht anderen Dateien, blockiert Submit ohne Owner oder
  behauptet Laufbarkeit ohne Nachweis.

## Evidence-Regel

Jeder `pass` braucht Beleg:

- Datei/Abschnitt fuer Doku-Checks
- Kommando/API-Readback fuer Runtime-Checks
- Owner, Frage, Fallback und Blocker-Status fuer externe Abhaengigkeiten

## COMM-DOC-001: Projektkontext Und Modulgrenze

Klartext:

Ein neues Teammitglied versteht ohne Chat-Historie, was Team 1 baut und was
nicht.

Pass wenn:

- `docs/project-context.md` und `docs/team-1/index.md` zeigen die aktuelle
  Arbeitswahrheit.
- Modulname, Route, Port, REST/JSON, PostgreSQL, Matrix/Synapse, Agent-Feed und
  Dummy-Useradapter sind eindeutig.
- Nicht-Ziele sind klar: keine eigene zentrale Auth, kein Matrix-Ersatz fuer
  Usermodul, kein Volltext-/Realtime-Scope-Creep.

Partial wenn:

- die Richtung stimmt, aber alte OpenBoard-Dateien noch als Wahrheit wirken.

Fail wenn:

- ein Leser nicht erkennt, ob `/chat` oder alte Kanban-/OpenBoard-MVP-Dateien
  massgeblich sind.

## COMM-CONTRACT-001: API-Vertrag

Klartext:

Andere Teams koennen das Modul ueber REST/JSON anbinden.

Pass wenn:

- `API.md` beschreibt Endpunkte, Request-/Response-Beispiele und Fehlerformat.
- `400`, `401`, `404` und Matrix-`503` sind beschrieben.
- Submit-Minimum ist klar markiert.

Partial wenn:

- Endpunkte gelistet sind, aber Beispiele oder Fehler fehlen.

Fail wenn:

- API-Vertrag und Architektur/DB-Plan widersprechen sich.

## COMM-DATA-001: PostgreSQL-Schema

Klartext:

PostgreSQL ist die Modul-Wahrheit fuer Gruppen, Wiki, Feed, Knowledge Graph,
Agent-Feed, Feedback und Matrix-Links.

Pass wenn:

- Tabellen aus `docs/team-1/database.md` existieren oder sind als Schema
  eindeutig ableitbar.
- `messages_cache` ist nur Cache/Referenz, kein Matrix-Vollarchiv.
- `matrix_event_links` verbindet Matrix-Events mit Modulobjekten.
- ENV-Variablen sind ohne Secrets dokumentiert.

Partial wenn:

- Tabellen dokumentiert sind, aber noch keine reproduzierbare Init-Strategie
  existiert.

Fail wenn:

- Matrix als alleinige Datenwahrheit behandelt wird oder Agent-Feedback fehlt.

## COMM-SEED-001: Demo- Und Seed-Daten

Klartext:

Das Modul startet nicht leer.

Pass wenn:

- mindestens 3 Dummy-User vorhanden sind
- mindestens 2 Gruppen vorhanden sind
- mindestens 1 Diskussion, 1 Frage, 1 Entscheidung vorhanden sind
- mindestens 2 Wiki-Artikel vorhanden sind
- Feed, Knowledge Graph und Agent-Feed Demo-Daten haben
- mindestens 2 Agent-Feedback-Beispiele vorhanden sind

Partial wenn:

- Seed-Daten beschrieben, aber nicht automatisiert angelegt sind.

Fail wenn:

- Hauptansichten leer starten.

## COMM-RUN-001: Lokale Laufbarkeit

Klartext:

Das Modul ist lokal auf Port `8001` pruefbar.

Pass wenn:

- `GET /health` liefert `{"status":"ok"}`.
- `/api/chat`-Endpunkte antworten mit JSON.
- `/chat` darf lokal als Dev-Alias funktionieren, ist aber nicht der
  Gateway-Pfad fuer das zentrale Frontend.
- `/openapi.json` ist erreichbar oder `API.md` ist bewusst als Doku-Ersatz
  akzeptiert.

Partial wenn:

- nur Doku existiert, aber noch kein lokaler API-Readback.

Fail wenn:

- kein Healthcheck oder falscher Port/falsche Route.

## COMM-MATRIX-001: Matrix/Synapse

Klartext:

Matrix ist Chat-Layer und per API mit Usern/Gruppen verlinkbar.

Pass wenn:

- Synapse ist als eigener Service vorhanden oder lokal pruefbar.
- User koennen mit Matrix-Usern verlinkt werden.
- Gruppen koennen mit Matrix-Raeumen verlinkt werden.
- Matrix-Ausfall liefert klares Fehlerverhalten.

Partial wenn:

- Link-API und Compose-Plan existieren, aber echter Synapse-Readback fehlt.

Fail wenn:

- Matrix nur Zukunftsidee ist oder als Ersatz fuer PostgreSQL/Usermodul genutzt
  wird.

## COMM-KG-001: Knowledge Graph Und Dashboard

Klartext:

Beziehungen sind sichtbar und per API abrufbar.

Pass wenn:

- `GET /api/chat/knowledge/graph` liefert Nodes und Edges.
- Graph enthaelt Personen, Gruppen, Wiki-Artikel, Threads/Entscheidungen und
  Beziehungen.
- `GET /api/chat/dashboard` zeigt Status, Gruppen, Feed, Wiki, Agent-Feed und
  Graph-Zusammenfassung.

Partial wenn:

- Graph-Struktur existiert, aber Dashboard oder Seed-Daten fehlen.

Fail wenn:

- Knowledge Graph nur erwaehnt, aber nicht abrufbar ist.

## COMM-AGENT-001: LLM-Agent Und Agent-Feed

Klartext:

Der Agent erzeugt nuetzliche Feed-Elemente und sammelt Feedback.

Pass wenn:

- `POST /api/chat/agent/analyze` erzeugt Agent-Feed-Elemente.
- Ohne echten LLM-Key funktioniert Mock/Fallback.
- Agent-Feed kann gelesen werden.
- Daumen-hoch/-runter-Feedback wird gespeichert.
- Keine Secrets liegen im Repo.

Partial wenn:

- Agent-Feed dokumentiert ist, aber noch kein Mock/Fallback laeuft.

Fail wenn:

- Agent verlangt zwingend einen echten Key oder nutzt alte Accept/Reject-
  Vorschlagslogik.

## COMM-USER-001: Dummy-Useradapter

Klartext:

Das Modul ist testbar, obwohl das Usermodul noch nicht fertig ist.

Pass wenn:

- `GET /api/chat/users` und `GET /api/chat/users/:id` funktionieren.
- Dummy-User sind klar als austauschbar markiert.
- `userId -> matrixUserId` Mapping ist getrennt vom Profil.

Partial wenn:

- Dummy-Daten dokumentiert, aber noch nicht per API erreichbar sind.

Fail wenn:

- das Modul eigene zentrale Userprofile als Wahrheit aufbaut.

## COMM-DEP-001: Externe Abhaengigkeiten

Klartext:

Offene Team-Abhaengigkeiten sind sichtbar und blockieren nicht heimlich.

Pass wenn jede offene Abhaengigkeit hat:

- Owner-Team
- konkrete Frage
- Fallback
- Blocker-Status

Aktuelle Abhaengigkeiten:

- Team intern/Backend: Docker-/PostgreSQL-Runtime-Readback
- Team 3/5: JWT-Felder, Issuer, Rollen, Admin-Rechte
- Team 5: echter User-Endpunkt und stabile User-ID
- Team 3: Gateway, Traefik, `modules.json`, OpenAPI-Anforderung
- Team 3/DevOps: Synapse-Startstrategie
- Team 4: spaeterer Import von Agent-Task-Listen
- Team intern: LLM-Provider und ENV-Namen

Partial wenn:

- Abhaengigkeiten benannt, aber Owner/Fallback fehlen.

Fail wenn:

- eine externe Antwort Submit blockiert und niemand verantwortlich ist.

## COMM-SUBMIT-001: End-To-End Submit-Gate

Klartext:

Das Modul ist abgabefaehig, nicht nur geplant.

Pass wenn:

- Healthcheck, API-Vertrag, DB, Seeds, Dummy-User, Matrix-Linking,
  Knowledge Graph, Agent-Feed, Dashboard und Docker/Gateway-Plan sind gruen.
- Runtime-Punkte haben echte lokale Belege oder klar markierte externe
  Fallbacks.
- Keine Secrets oder Runtime-Dateien sind im Repo.

Partial wenn:

- lokale Mock-Laufbarkeit steht, aber Docker/PostgreSQL-Runtime,
  Synapse/Gateway/Auth, echtes Usermodul oder Team-4-Import noch externe
  Gegenchecks brauchen.

Fail wenn:

- nur Doku existiert und kein lauffaehiger Kern nachweisbar ist.

## Ask-Vs-Implement-Gates

Implementieren ohne Nachfrage:

- `/chat`, Port `8001`, REST/JSON
- `GET /health`
- API.md/OpenAPI-Vertrag
- PostgreSQL-Schema nach DB-Plan
- Seed-Daten
- Dummy-Useradapter
- Mock-LLM und Agent-Feed
- Daumen-hoch/-runter-Feedback
- Knowledge Graph und Dashboard aus Demo-Daten
- `.env.example` nur mit Platzhaltern

Erst fragen oder gegenchecken:

- echte JWT-Felder, Issuer, Rollen und Admin-Rechte
- echter Usermodul-Endpunkt und stabile User-ID
- Synapse: Raeume anlegen oder nur verlinken
- Gateway/Traefik und `modules.json`
- ob `/openapi.json` zwingend live sein muss
- ob Team 4 Agent-Task-Listen spaeter importiert
- finaler LLM-Provider und ENV-Namen

## Reihenfolge

1. Kontext und Quellen sortieren.
2. API/DB-Vertrag einfrieren.
3. Rust/Axum-Grundmodul bauen.
4. PostgreSQL-Schema und Seeds bauen.
5. Core-API bauen.
6. Matrix-Linking bauen.
7. Knowledge Graph und Dashboard bauen.
8. Agent-Feed mit Mock/Fallback bauen.
9. Test-UI/Demo bauen.
10. Docker/Gateway/Submit pruefen.

Details stehen in `docs/team-1/roadmap.md`.
