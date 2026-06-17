# Team 1 Kommunikation: Start Hier

Stand: 2026-06-17

## Zweck

Diese Datei ist der Einstieg fuer das Team-1-Modul `Kommunikation`. Wenn ein
neuer Chat oder ein Teammitglied ohne Vorgeschichte startet, zuerst hier lesen.

## Aktuelle Arbeitswahrheit

- Team: 1
- Modul: `Kommunikation`
- Frontend-Route: `/chat`
- Backend-API-Basis ueber Gateway: `/api/chat`
- Lokale Dev-Aliasroute im Axum-Service: `/chat`
- Port: `8001`
- Format: REST ueber JSON
- Submit-Ziel: laufendes Modul, nicht nur Planung
- API: Rust/Axum empfohlen
- Datenbank: PostgreSQL als Modul-Wahrheit
- Chat: Matrix/Synapse als eigener Chat-Layer
- Agent: Agent-Feed mit Daumen-hoch/-runter-Feedback
- User: erst Dummy-Useradapter, spaeter echtes Usermodul

Stack-Entscheidung: Rust ist fuer den Backend-Kern sinnvoll. Axum liefert die
REST-API, SQLx greift auf PostgreSQL zu, `utoipa` erzeugt nach Moeglichkeit
`/openapi.json`. Das zentrale Frontend bleibt normale Web-Technik; Team 1
liefert dafuer API-Daten, Stylesheet-Kontext und bei Bedarf einen lokalen
Struktur-Prototyp, aber kein eigenes produktives Frontend im Team-Repo.

## Quellenreihenfolge

1. `docs/project-context.md`: aktuelle Projektwahrheit.
2. `docs/team-1/index.md`: Einstieg und Lesereihenfolge fuer Team 1.
3. `CONTRIBUTING.md`: Submit-Regeln und Annahmekriterien.
4. `docs/team-1/architecture.md`: Modulgrenze und Architektur.
5. `API.md`: REST-/JSON-Vertrag mit Beispielen.
6. `docs/team-1/database.md`: DB-Entscheidung, Tabellen, ENV, Submit-Gates.
7. `docs/team-1/roadmap.md`: Reihenfolge von Fragen, Implementierung und Gates.
8. `docs/team-1/implementation-plan.md`: konkrete parallele Arbeitspakete.
9. `docs/team-1/evals.md`: Klartext-Evals und Submit-Regeln.
10. `evals/team-1-kommunikation.json`: maschinenlesbare Eval-Spiegelung.
11. `.codex/NOW.md` und `.codex/TASKS.md`: Agent-Arbeitsstand, nicht Projektkanon.

## Wichtige Dateien

- `README.md`: kurzer Repo-Einstieg.
- `CONTRIBUTING.md`: Submit-Regeln und Annahmekriterien.
- `API.md`: API-Vertrag.
- `docs/team-1/architecture.md`: Scope, Stack, Kernobjekte, Endpunkte.
- `docs/team-1/database.md`: PostgreSQL/Matrix-Trennung und Schema-Idee.
- `docs/team-1/roadmap.md`: Phasenplan mit Ask-vs-Implement-Gates.
- `docs/team-1/implementation-plan.md`: konkreter Subagenten-Umsetzungsplan.
- `docs/team-1/evals.md`: Klartext-Evals.
- `docs/team-1/glossary.md`: Fachwoerter einfach erklaert.
- `docs/team-1/ui-brief.md`: Test-UI-Brief.
- `docs/team-1/design-guide.md`: Stylesheet-/Design-Vorgaben.
- `docs/team-1/group-notes.md`: Team-1-Notizen.
- `evals/team-1-kommunikation.json`: maschinenlesbare Eval-Struktur.
- `styles/Stylesheet.css`: uebernommene Design-Grundlage.

## Archiv

Alte OpenBoard-/Kanban-MVP-Dateien liegen unter:

- `docs/archive/openboard-mvp/`

Diese Dateien sind Hintergrund, aber nicht die aktuelle Arbeitswahrheit fuer
Team 1. Fuer neue Arbeit immer bei `docs/project-context.md` und dieser Datei
starten.

## Arbeitsregel

Ohne Nachfrage implementieren, wenn es bereits eindeutig dokumentiert ist:

- Frontend-Route `/chat`, Backend-API `/api/chat`, Port `8001`, REST/JSON
- `GET /health`
- API.md/OpenAPI-Vertrag
- PostgreSQL-Schema nach `docs/team-1/database.md`
- Dummy-Useradapter
- Mock/Fallback fuer LLM-Agent
- Agent-Feed und Daumen-hoch/-runter-Feedback
- Knowledge Graph und Dashboard auf Basis lokaler Demo-Daten
- `.env.example` nur mit Platzhaltern

Vorher fragen oder mit Team gegenchecken:

- echte JWT-Felder, Issuer, Rollen, Admin-Rechte
- echter Usermodul-Endpunkt und stabile User-ID
- Synapse-Strategie: Raeume anlegen oder nur verlinken
- Gateway/Traefik-Registrierung und `modules.json`
- ob `/openapi.json` zwingend live sein muss oder `API.md` reicht
- ob Team 4 Agent-Task-Listen spaeter importieren soll
- finaler LLM-Provider und ENV-Namen

## Nicht Committen

- `.env`, Secrets, Tokens, API-Keys, Matrix-Tokens, JWTs
- Datenbanken, Uploads, Caches, Runtime-Ausgaben
- `.codex/skill-runtime-cache.json`

`.codex/NOW.md` und `.codex/TASKS.md` nur committen, wenn Agent-Kontext bewusst
Teil des Repos sein soll.
