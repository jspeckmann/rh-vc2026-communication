# Team 1 Design-Vorgaben

Stand: 2026-06-17

## Quelle

Als aktuelle Design-Vorgabe wird diese Datei im Projekt genutzt:

- `styles/Stylesheet.css`

Sie wurde aus `/Users/davidmac/Downloads/Stylesheet.css` uebernommen.

Es gab zusaetzlich `/Users/davidmac/Downloads/Stylesheet (1).css`. Diese Datei
wurde nicht als Hauptversion uebernommen, weil sie weniger vollstaendig ist:

- kein Dark Mode
- `--font-size-big` wird genutzt, aber nicht definiert
- `--border-radius` wird genutzt, aber nicht definiert

## Einfach Erklaert

Das Stylesheet ist die gemeinsame Design-Grundlage. Es legt Farben, Schrift,
Abstaende, Buttons, Eingabefelder und Hilfsklassen fest. Die Test-UI soll diese
Vorgaben nutzen, damit sie nicht wie ein Fremdteil wirkt.

## Design-Tokens

### Schrift

- Schrift: `Noto Sans`
- Quelle: Google Fonts Import im CSS
- Wichtig: Wenn Internet blockiert ist, faellt der Browser auf `sans-serif`
  zurueck.

### Farben

- Hintergrund hell: `#F6F3F5`
- Text hell: `#100A19`
- Akzent: `#5A58A6`
- Hellviolett: `#888BBF`
- Erfolg: `#6BCF7F`
- In Arbeit: `#FFD700`
- Fehler: `#FF6B6B`
- Gruen: `#6B8E23`
- Pink: `#E97BB0`
- Grau: `#66606D`

Dark Mode:

- Hintergrund dunkel: `#100A19`
- Text dunkel: `#F6F3F5`
- Akzent dunkel: `#888BBF`

### Schriftgroessen

- grosse Titel: `52px`
- mittlere Titel: `42px`
- Untertitel: `38px`
- grosser Text: `26px`
- normaler Haupttext: `20px`

Empfehlung: Fuer die Test-UI diese Groessen nicht blind ueberall nutzen.
Dashboard, Tabellen, Sidebars und Chat brauchen kleinere UI-Texte, sonst wird
alles zu gross.

### Abstaende

- klein: `8px`
- mittel: `16px`
- gross: `24px`
- extra gross: `40px` bis `48px`
- Seitenrand: `100px`

Empfehlung: `100px` Seitenrand ist fuer Desktop okay, aber fuer Handy zu gross.
Die Test-UI braucht eigene responsive Regeln fuer kleinere Bildschirme.

### Komponenten

Vorhanden:

- `.btn` fuer Buttons
- `.input-field` fuer Eingabefelder
- `.feedback-success`
- `.feedback-in-progress`
- `.feedback-error`
- `.rounded`
- Utility-Klassen wie `.mt-2`, `.pb-1`, `.ml-3`

## Empfehlung Fuer Die Test-UI

Nutzen:

- Farben und Schrift aus `styles/Stylesheet.css`
- `.btn` fuer Hauptaktionen
- `.input-field` fuer Chat-/Formularfelder
- Feedback-Farben fuer Status: API, DB, Matrix, LLM
- Dark Mode ueber `[data-theme="dark"]`

Zusaetzlich bauen:

- kleinere UI-Textklassen fuer Sidebar, Tabellen, Statuschips und Chat
- responsive Layout-Regeln fuer Handy und kleine Laptops
- Panel-/Card-Stil fuer Dashboardbereiche, weil das Stylesheet dafuer noch
  keine eigene Klasse hat

## Fragen An Design-Team

Diese Punkte sind noch offen:

1. Ist `Stylesheet.css` wirklich die finale Version?
2. Soll der Test-Prototyp hell oder dunkel starten?
3. Duerfen wir eigene Panel-/Card-Klassen ergaenzen?
4. Gibt es Logo, Icons oder konkrete Wireframes?
5. Sollen Buttons `8px` oder `4px` Radius haben? Die beiden CSS-Dateien waren
   hier unterschiedlich.

## Satz Fuer Das Team

> Ich habe die Design-Vorgabe ins Projekt uebernommen. Wir nutzen die Farben,
> Noto Sans, Buttons, Inputs und Dark-Mode-Variablen daraus. Fuer Dashboard,
> Chat und Graph brauchen wir noch kleine Zusatzklassen, weil das Stylesheet
> eher Basis-Design als komplette App-Komponenten vorgibt.
