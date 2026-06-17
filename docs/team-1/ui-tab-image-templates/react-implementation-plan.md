# React UI Implementation Plan

Stand: 2026-06-17

## Ziel

Die Apple-like Tab-Vorlagen werden als echte React-Oberflaeche umgesetzt, nicht
als statische Screenshots. Die UI bleibt an die bestehenden API-Funktionen in
`frontend/src/services/api.js` angebunden und kann spaeter weiter in Hooks oder
Controller aufgeteilt werden.

## Umsetzung

1. Zentrale Design-Tokens und wiederverwendbare Klassen in
   `frontend/src/index.css`: Glasflaechen, Panels, Buttons, Inputs, Chips,
   Navigation und Mobile-Breakpoint.
2. App-Shell mit Brand-Mark, Sidebar, Breadcrumb, Subnav und Theme-Control als
   gemeinsamer Rahmen fuer alle Tabs.
3. Tab-Layouts nach Vorlage:
   - Dashboard: Status, Gruppen, Feed, Agent und Graph-Zusammenfassung.
   - Gruppen: Master-Detail, Mitglieder, Matrix-Raeume.
   - Chat: Gruppen/Threads, Nachrichten, Composer, rechte Kontext-/AI-Rail.
   - Wiki: Artikelliste, Editor/Lesebereich, rechte Metadaten-Rail.
   - Vernetzungswolke: Graph-Canvas, Filter, Inspector und Bearbeitungsformen.
   - AI Feed: bindbares Overlay mit Feed, Details, Analyse und Feedback.
4. Mobile: Sidebar und Hauptbereiche stapeln, keine horizontale Scrollbreite.

## Spaetere Anbindung

- HTTP bleibt in `frontend/src/services/api.js`.
- UI-only Felder getrennt halten: `collapsed`, `pending`, `sendError`.
- Naechster Struktur-Schritt: Hooks wie `useThreads(groupId)`,
  `useWiki(groupId)` und `useKnowledgeGraph()` einfuehren, sobald die API stabil
  ist.
- Matrix-Status, LLM-Fallback und User-Dummy bleiben sichtbar, bis echte
  Integrationen final sind.

## Abnahme

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- Desktop-Preview auf `http://127.0.0.1:5174/chat`
- Mobile-Viewport `390x844`, kein horizontales Overflow
