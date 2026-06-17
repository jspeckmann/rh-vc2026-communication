# Team 1: Kommunikation Und Wissen

## Auftrag

- Architektur fuer das Team-1-Modul `Kommunikation` klaeren
- Kommunikation zwischen Personen und Gruppen modellieren
- Wiki/Knowledge Base modellieren
- REST-/JSON-API fuer `/api/chat` planen; Frontend-Route bleibt `/chat`
- Healthcheck, API-Doku, Docker und Gateway-Anbindung mitdenken
- Schnittstellen zu Team 3/5 fuer Authentik/JWT markieren

## Ergebnis

- baubare Modulgrenze fuer Kommunikation, Gruppen, Wiki und Knowledge Base
- Datenmodell mit Kernobjekten
- API-Entwurf mit Endpunkten
- klare Nicht-Ziele
- Integrationsvertrag fuer andere Teams

## UI-/Design-Bedarf

- Screens fuer Gruppen, Diskussionen, Wiki-Artikel und optionale Moderation
- Felder fuer Gruppen, Threads, Messages und Wiki-Artikel
- leere Zustaende und Fehlermeldungen
- gemeinsame Stylesheet-Konventionen beachten

## Notizen Von Der Gruppe

- David ist in Gruppe 1 und arbeitet am Architektur-Teil, nicht am Frontend.
- Eine andere Person arbeitet am Design fuer das Modul.
- Team-1-Modul laut Team-Konventionen: Kommunikation auf Frontend-Route
  `/chat`, Backend-Route `/api/chat`, Port `8001`.
- Modulziel: Kommunikation zwischen Personen/Gruppen plus Wiki/Knowledge Base.
- Gewuenschtes Ergebnis ist ein fertig plan- und baubares Modul, nicht nur ein Demo-Slice.
- Details stehen in `docs/team-1/architecture.md`.
- DB-Entscheidung steht in `docs/team-1/database.md`: PostgreSQL ist
  Modul-Wahrheit, Matrix ist Chat-Layer, der Agent nutzt einen eigenen Feed mit
  Daumen-hoch/-runter-Feedback.
