# Teamstruktur

Stand: 2026-06-17

## Grundstruktur

Es gibt 5 Teams/Module. Team 3 stellt Admin/Orga/Gateway-Konventionen bereit.
Team 1 baut das Modul `Kommunikation`.

## Team 1: Kommunikation

Aufgaben:

- Kommunikation zwischen Personen und Gruppen modellieren
- Gruppen, Diskussionen, Nachrichten und Entscheidungen definieren
- Wiki/Knowledge Base modellieren
- PostgreSQL-Schema fuer Gruppen, Wiki, Feed, Knowledge Graph, Agent-Feed und
  Matrix-Links klaeren
- Matrix/Synapse als Chat-Layer mit Gruppen/Usern verknuepfen
- Knowledge Graph und Agent-Feed mit Daumen-hoch/-runter-Feedback einplanen
- REST-/JSON-API fuer `/chat` festlegen
- Healthcheck, API-Doku und Docker-/Traefik-Konventionen einplanen
- optionalen Admin-/Moderationsbereich unter `/chat/admin` klaeren

Ergebnis:

- fertig plan- und baubares Modul
- klare Datenobjekte und Endpunkte
- klare DB-Entscheidung mit Submit-Schema
- klare Roadmap mit Ask-vs-Implement-Gates
- Klartext-Evals fuer Submit-Readiness
- klare Nicht-Ziele
- Integrationsvertrag fuer andere Teams

Massgebliche Dateien:

- `docs/team-1/index.md`
- `docs/team-1/architecture.md`
- `API.md`
- `docs/team-1/database.md`
- `docs/team-1/roadmap.md`
- `docs/team-1/evals.md`

## Team 2: Dateimanagement

Route laut Team-Konventionen: `/files`, Port `8002`.

## Team 3: Admin, Orga und Gateway

Aufgaben:

- zentrale Konventionen
- Gateway/Traefik
- Healthchecks/Monitoring
- Authentik unter `/auth`

Ergebnis:

- verbindliche Modul-Schnittstellen
- `modules.json`-Registrierung
- Admin-Dashboard

## Team 4: Projektplanung

Route laut Team-Konventionen: `/planning`, Port `8004`.

## Team 5: Userverwaltung

Aufgaben:

- Userverwaltung
- Rechte/Rollen
- Anbindung an Authentik gemeinsam mit Team 3

Ergebnis:

- zentrale User-/Rollenbasis fuer Module

## Modul-Konventionen

Jedes Modul liefert:

- `GET /health`
- REST ueber JSON
- API-Doku per `/openapi.json` oder `API.md`
- Dockerfile
- Compose-Service-Snippet mit Traefik-Labels
- Gateway-Registrierung oder Meldung an Team 3

## Aktuelle Prioritaet Fuer David

David arbeitet an der Architektur von Team 1. Frontend-Design liegt bei einer
anderen Person. Wichtig ist eine klare Uebergabe: Modulgrenze, Objekte,
Endpunkte, Nicht-Ziele und offene externe Abhaengigkeiten.
