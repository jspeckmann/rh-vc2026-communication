# Team 1: Begriffe Und Fragen

Stand: 2026-06-17

Diese Datei erklaert die wichtigsten Fachwoerter fuer das
Kommunikationsmodul. Ziel ist: Du kannst im Team sagen, was gemeint ist, ohne
so zu tun, als waerst du schon Experte fuer jedes Detail.

## Kurzempfehlung

Wir bauen ein eigenes Kommunikationsmodul. Es hat eine API, eine Datenbank,
Matrix fuer Chat, einen Knowledge Graph fuer Beziehungen, ein Dashboard und
einen LLM-Agenten mit eigenem Agent-Feed.

Meine Empfehlung:

- Rust/Axum fuer die API nehmen.
- SQLx fuer PostgreSQL-Queries und Migrationen nehmen.
- PostgreSQL fuer die Datenbank nehmen.
- Synapse als Matrix-Server im Docker Compose mitliefern.
- LLM mit echtem API-Key unterstuetzen, aber Mock/Fallback fuer Tests behalten.
- Usermodul erstmal durch Dummy-Daten ersetzen und spaeter gegen echten Endpoint
  tauschen.

## Begriffe Einfach Erklaert

### Modul

Ein Modul ist ein eigener Teil der Gesamt-App. Unser Modul ist fuer
Kommunikation, Gruppen, Wiki, Knowledge Base, Feed und Agent-Feed
zustaendig.

### API

Eine API ist die Schnittstelle, ueber die andere Teile der App mit unserem
Modul reden. Beispiel: Das zentrale Frontend fragt `GET /api/chat/groups`, und
unser Modul antwortet mit Gruppen als JSON.

### Endpoint

Ein Endpoint ist eine einzelne Adresse in der API. Beispiel:
`GET /health` prueft, ob das Modul lebt.

### REST

REST ist ein einfacher Stil fuer APIs. Man nutzt normale Web-Adressen und
Methoden wie `GET` fuer lesen und `POST` fuer erstellen.

### JSON

JSON ist ein Textformat fuer Daten. Beispiel:

```json
{"status":"ok"}
```

### Rust

Rust ist eine Programmiersprache, die viele Fehler schon beim Bauen findet.
Fuer unser Backend ist das sinnvoll, weil API-Vertrag, Datenmodell und
PostgreSQL-Zugriffe stabil bleiben sollen.

### Axum

Axum ist ein Rust-Framework fuer Web-APIs. Es passt fuer unser Modul, weil es
REST/JSON, Routen und saubere Fehlerbehandlung ohne viel Magie ermoeglicht.

### SQLx

SQLx ist eine Rust-Bibliothek fuer Datenbankzugriffe. Vorteil: Wir schreiben
echte SQL-Queries, koennen sie pruefen und behalten das PostgreSQL-Schema gut
nachvollziehbar.

### utoipa

`utoipa` kann aus Rust-Code OpenAPI-Doku erzeugen. Wenn das im Hackathon zu viel
Zeit kostet, bleibt `API.md` der verbindliche API-Vertrag.

### PostgreSQL

PostgreSQL ist eine richtige Datenbank. Dort speichern wir Gruppen, Wiki,
Feed, Knowledge Graph, Matrix-Verknuepfungen, Agent-Feed und Agent-Feedback.

### Matrix

Matrix ist ein offenes Chat-System. Es kann Raeume, User und Nachrichten
verwalten. Fuer uns ist Matrix der Chat-Layer, aber nicht die einzige
Datenquelle.

### Synapse

Synapse ist eine bekannte Server-Software fuer Matrix. Wenn wir Matrix selbst
hosten, laeuft wahrscheinlich Synapse als eigener Docker-Service.

### Docker

Docker verpackt Software so, dass sie auf anderen Rechnern einfacher gleich
startet. Fuer Submit ist wichtig: Unser Modul, PostgreSQL und Synapse sollen
per Docker laufen koennen.

### Docker Compose

Docker Compose startet mehrere Docker-Services zusammen. Bei uns waeren das
zum Beispiel:

- API-Modul
- PostgreSQL-Datenbank
- Matrix/Synapse

### Traefik

Traefik ist der Eingang/Router fuer Web-Anfragen. Er sorgt dafuer, dass
Anfragen an `/chat` bei unserem Modul landen.

### Healthcheck

Ein Healthcheck ist ein einfacher Test, ob ein Service laeuft. Vorgabe:
`GET /health` muss `{"status":"ok"}` liefern.

### OpenAPI

OpenAPI ist eine maschinenlesbare API-Dokumentation. Andere Teams koennen
darin sehen, welche Endpunkte es gibt und welche Daten erwartet werden.

### Authentik

Authentik ist das zentrale Login-System. Wir bauen also kein eigenes Login,
sondern pruefen spaeter Tokens von Authentik.

### JWT

JWT ist ein Login-Token. Darin steht zum Beispiel, welcher User anfragt und
welche Rolle er hat.

### Usermodul

Das Usermodul ist die Wahrheit fuer Profile/User. Unser Modul speichert nur,
welcher User zu welchem Matrix-User gehoert. Bis das echte Usermodul da ist,
nutzen wir Dummy-User.

### Dummy

Ein Dummy ist ein Platzhalter, der beim Testen hilft. Beispiel: Wir legen drei
Test-User fest, obwohl das echte Usermodul noch nicht fertig ist.

### Mock / Fallback

Ein Mock ist eine kuenstliche Antwort fuer Tests. Ein Fallback ist ein
Ersatzverhalten, falls etwas fehlt. Beispiel: Ohne LLM-Key erzeugt der Agent
einfache Test-Feed-Elemente statt echte KI-Antworten.

### LLM

Ein LLM ist ein Sprachmodell, also die Art KI hinter ChatGPT. In unserem Modul
soll es Kommunikation zusammenfassen, wichtige Nachrichten priorisieren,
Task-Listen bauen und naechste Schritte sichtbar machen.

### API-Key

Ein API-Key ist ein geheimer Zugangsschluessel fuer einen Dienst, zum Beispiel
fuer ein LLM. Er darf nicht ins Repo geschrieben werden.

### ENV / Umgebungsvariable

ENV meint Konfiguration von aussen. Ein API-Key wird zum Beispiel als
Umgebungsvariable gesetzt, damit er nicht im Code steht.

### Feed

Ein Feed ist eine sortierte Liste wichtiger Ereignisse. Beispiel: neue
Nachricht, neue Entscheidung, neuer Wiki-Artikel oder Agent-Feed-Element.

### Agent-Feed

Der Agent-Feed ist die eigene Liste des LLM-Agenten. Dort legt der Agent
nuetzliche Elemente ab, zum Beispiel Zusammenfassungen, Task-Listen,
priorisierte Nachrichten, Risiken oder naechste Schritte.

### Agent-Feedback

Agent-Feedback bedeutet: Teammitglieder koennen bei Agent-Feed-Elementen Daumen
hoch oder Daumen runter geben. Damit sieht man, was hilfreich war und was nicht.

### Knowledge Base

Eine Knowledge Base ist eine Wissenssammlung. Bei uns sind das Wiki-Artikel,
Entscheidungen, Erklaerungen und Projektnotizen.

### Knowledge Graph

Ein Knowledge Graph zeigt Beziehungen zwischen Dingen. Beispiel:
Person A gehoert zu Gruppe B, Gruppe B diskutiert Thema C, Thema C steht in
Wiki-Artikel D.

### Node

Ein Node ist ein Punkt im Knowledge Graph. Beispiel: eine Person, Gruppe,
Entscheidung oder ein Wiki-Artikel.

### Edge

Eine Edge ist eine Verbindung zwischen zwei Nodes. Beispiel:
`David -> ist Mitglied von -> Gruppe 1`.

### Dashboard

Ein Dashboard ist eine Uebersichtsseite oder ein Uebersichts-Endpunkt. Es zeigt
zum Beispiel Feed, Wiki-Auszug, Graph-Zusammenfassung und Agent-Feed.

## Was Du Selbst Sicher Sagen Kannst

- Unser Modul ist fuer Kommunikation und Wissen zustaendig.
- Matrix macht den Chat.
- Unsere eigene Datenbank speichert Wiki, Feed, Graph und Agent-Daten.
- User kommen spaeter aus dem Usermodul; bis dahin nutzen wir Dummy-User.
- Der LLM-Agent soll im Agent-Feed nuetzliche Elemente erzeugen, zum Beispiel
  Task-Listen oder priorisierte Nachrichten.
- Vor Submit pruefen wir alles gegen unsere Evals.

## Was Du Informatiker Fragen Solltest

Diese Punkte sind technisch wichtig und sollten Leute mit mehr Backend-/DevOps-
Erfahrung pruefen:

- Koennt ihr Synapse schnell und stabil im Docker Compose starten?
- Welche Synapse-Konfiguration brauchen wir minimal fuer lokale Tests?
- Stimmen Frontend-Route `/chat`, Backend-Route `/api/chat`, Port `8001` und
  Traefik-Labels mit dem Gateway?
- Wie legen wir PostgreSQL-Tabellen und Testdaten automatisch beim Start an?
- Wie soll der echte User-Endpunkt spaeter aussehen?
- Wie pruefen wir JWT/Authentik spaeter, ohne jetzt eigenes Login zu bauen?
- Welcher LLM-Anbieter wird genutzt und wie heisst die ENV-Variable fuer den
  API-Key?
- Was ist der Minimaltest, der vor Submit wirklich gruen sein muss?

## Satz Fuer Das Team

> Ich will die Architektur so dokumentieren, dass alle Fachwoerter erklaert
> sind. Die technische Umsetzung von Matrix, Docker, Datenbankmigration und
> Authentik sollten wir kurz mit den Informatikern gegenchecken, damit wir vor
> Submit keine versteckten Risiken haben.

Die konkrete Datenbankentscheidung steht in `docs/team-1/database.md`.
