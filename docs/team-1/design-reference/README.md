# Team 1 Design-Referenz: Codex Base

Stand: 2026-06-17

Diese Referenz sichert die UI-Version, die David als passende Base fuer die
App-Designsprache markiert hat.

## Quelle

- Git-Commit: `6753aadc409bc16166f1d7d3364d45fb3577fdaa`
- Branch zur Zeit der Erstellung: `codex/team1-frontend-backend`
- Commit-Titel: `Build Team 1 communication module`
- Lokale Preview beim Sichern: `http://127.0.0.1:5191/`
- Browser-Titel: `Kommunikation | Team 1`

## Gesicherte Dateien

Die relevanten UI-Quellen liegen unter:

- `docs/team-1/design-reference/codex-base/frontend/src/App.jsx`
- `docs/team-1/design-reference/codex-base/frontend/src/components/views.jsx`
- `docs/team-1/design-reference/codex-base/frontend/src/components/common.jsx`
- `docs/team-1/design-reference/codex-base/frontend/src/styles/app.css`
- `docs/team-1/design-reference/codex-base/frontend/index.html`
- `docs/team-1/design-reference/codex-base/frontend/vite.config.mjs`

## Design-Elemente, Die Wir Behalten Wollen

- App-Shell mit linker Navigation und ruhigem Arbeitsbereich
- Brand-Mark `T1` und kompakte Modul-Kennung
- Top-Bar mit View-Titel, Nutzerwahl und Theme-Toggle
- Status-Strip, Chips und kompakte Metrikkarten
- Flaechige Panels ohne ueberladene Landingpage
- Detail-Rail fuer Gruppe, Wiki, Agent und Kontextinfos
- Zurueckhaltende Akzentfarben mit hell/dunkel Theme
- 8px-Radien, klare Listen, dichte aber scanbare Dashboard-Struktur

## Nutzung

Diese Dateien sind Referenzmaterial. Die aktuelle App soll nicht blind ersetzt
werden; relevante Layout-, Farb-, Navigations- und Panel-Patterns daraus sollen
gezielt in die aktive Frontend-Struktur uebernommen werden.
