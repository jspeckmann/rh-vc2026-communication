# Team 1 Test-UI Brief

Stand: 2026-06-17

## Ziel

Das produktive Frontend wird laut Team-Konventionen zentral verwaltet. Team 1
liefert dafuer API-Vertrag, Datenformen und bei Bedarf einen lokalen
Struktur-Prototyp fuer das Kommunikationsmodul. Der Prototyp muss noch nicht
final aussehen, soll aber zeigen, welche Bereiche das Modul braucht und ob die
Architektur im Produkt verstaendlich ist.

## Was Schon Gespeichert Ist

Die fachlichen Anforderungen stehen in:

- `docs/team-1/architecture.md`
- `docs/team-1/evals.md`
- `docs/team-1/glossary.md`
- `evals/team-1-kommunikation.json`

Fuer die Test-UI gilt daraus:

- Frontend-Route des Moduls: `/chat`
- Backend-API-Basis fuer das zentrale Frontend: `/api/chat`
- Port des Moduls: `8001`
- Modulname: `Kommunikation`
- Pflichtbereiche: Gruppen, Matrix-Chat, Wiki/Knowledge Base, Feed,
  Knowledge Graph, Dashboard, LLM-Agent, Dummy-User
- Matrix ist Pflicht und wird als Chat-Layer gezeigt.
- PostgreSQL ist Pflicht, aber in der UI nur indirekt sichtbar.
- LLM-Agent muss sichtbar pruefbar sein.
- Dummy-User muessen sichtbar sein, bis das echte User-Modul da ist.

## Bekannte Design-Vorgabe

Aus `TEAM-CONVENTIONS.md` ist bekannt:

- Team-Repos enthalten kein produktives Frontend; das Frontend wird zentral
  verwaltet und deployed.
- Frontend-Module sollen das gemeinsame Stylesheet
  `styles/Stylesheet.css` nutzen.
- CSS-Variablen fuer Farben, Spacing, Typografie und Border-Radius verwenden.
- Dark Mode soll ueber `[data-theme="dark"]` funktionieren.
- Bestehende Utility-Klassen wie `.btn`, `.input-field`,
  `.feedback-success`, `.feedback-error`, `.mt-2`, `.pb-1` sollen genutzt
  werden, falls sie im Stylesheet existieren.

Die Design-Datei ist jetzt im Projekt vorhanden:

- `styles/Stylesheet.css`

Details und einfache Erklaerung stehen in:

- `docs/team-1/design-guide.md`

## Noch Fehlende Design-Team-Vorgaben

Diese Punkte sind aktuell nicht im Projektordner vorhanden und muessen vom
Design-Team oder einer Design-Datei kommen:

- Button-/Input-/Card-Stil
- Layout-Vorgaben fuer Desktop und Mobile
- Logo oder Modul-Branding
- konkrete Screens/Wireframes
- Entscheidung, ob der helle oder dunkle Modus zuerst gezeigt wird

Empfehlung: Wenn das Design-Team diese Punkte schon hat, Datei oder Screenshot
ins Projekt legen und in dieser Datei verlinken.

## Test-UI Screens

### 1. Dashboard

Zweck: schneller Gesamtueberblick.

Muss zeigen:

- Modulstatus: API, Datenbank, Matrix, LLM, User-Dummy
- aktuelle Gruppen
- neueste Feed-Eintraege
- neue Agent-Feed-Elemente
- kleine Knowledge-Graph-Zusammenfassung

### 2. Gruppen

Zweck: Personen und Gruppen organisieren.

Muss zeigen:

- Gruppenliste
- Gruppenbeschreibung
- Mitglieder mit Dummy-Userdaten
- verknuepfter Matrix-Raum

### 3. Matrix-Chat

Zweck: zeigen, wie Chat im Modul gedacht ist.

Muss zeigen:

- Gruppenraum
- Nachrichtenliste
- Eingabefeld fuer Nachricht
- Hinweis, ob Matrix verbunden ist

### 4. Wiki / Knowledge Base

Zweck: Wissen sammeln und auffindbar machen.

Muss zeigen:

- Artikelliste
- Artikel-Detail
- Tags
- Autor
- Bezug zu Gruppe oder Thema

### 5. Knowledge Graph

Zweck: Beziehungen sichtbar machen.

Muss zeigen:

- Personen, Gruppen, Themen, Entscheidungen, Wiki-Artikel als Punkte
- Beziehungen als Linien oder Liste
- Beispiel: Person ist Mitglied von Gruppe; Gruppe diskutiert Thema; Thema ist
  in Wiki-Artikel dokumentiert

### 6. LLM-Agent

Zweck: zeigen, wie der Agent Kommunikation verbessert.

Muss zeigen:

- Agent-Feed mit erzeugten Elementen
- Zusammenfassung
- Task-Liste
- Message-Priorisierung
- Buttons: Daumen hoch, Daumen runter
- Hinweis: echter LLM-Key per ENV, sonst Mock/Fallback

## Empfehlung Fuer Die Erste Test-UI

Nicht mit perfektem Design anfangen. Erst eine klickbare Test-UI bauen, die
alle Modulbereiche sichtbar macht:

- linke Navigation
- Hauptbereich je Screen
- rechte Detail-/Agent-Spalte
- klare Statusanzeige fuer Matrix, DB und LLM
- Dummy-Daten statt leerer Screens

Danach Design-Team-Stil anwenden.

## Fragen An Das Design-Team

Diese Fragen sollte David stellen:

1. Gibt es die Datei `styles/Stylesheet.css` schon, und wo liegt sie?
2. Welche Farben und Schrift sollen wir nutzen?
3. Gibt es Wireframes fuer `/chat`?
4. Soll die Test-UI eher Dashboard, Chat-App oder Wiki-App wirken?
5. Gibt es Pflicht-Komponenten wie Buttons, Cards, Inputs, Tabs?
6. Muss Dark Mode beim Submit schon gut aussehen?

## Satz Fuer Das Team

> Ich baue die Test-UI erstmal als klickbaren Struktur-Prototyp. Die
> Pflichtbereiche aus Architektur und Evals sind gespeichert. Das Stylesheet
> liegt jetzt im Projekt; was noch fehlt, sind konkrete Wireframes, Logo und
> Layout-Entscheidungen vom Design-Team.
