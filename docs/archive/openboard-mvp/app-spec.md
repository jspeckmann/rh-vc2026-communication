# App-Spezifikation

> Archiv-Hinweis: Historischer OpenBoard-/Kanban-MVP-Kontext. Nicht die
> aktuelle Arbeitswahrheit fuer Team 1. Aktuell ist `docs/team-1/index.md`.

Stand: 2026-06-16

## Kurzidee

OpenBoard ist ein schlankes Organisationssystem fuer Gruppenprojekte. Es soll
Projekte, Aufgaben, Verantwortlichkeiten, Fortschritt, Kommunikation und
Entscheidungen in einer einfachen App zusammenbringen.

## MVP

Pflicht:

- Projektuebersicht
- Projekt-Board mit Spalten `To Do`, `In Progress`, `Review`, `Done`
- Aufgaben erstellen und bearbeiten
- Aufgaben verschieben
- Prioritaet und verantwortliche Person setzen
- Demo-Nutzer oder Teammitglieder
- Kommentare oder Aktivitaetsverlauf
- einfache Fortschrittsanzeige
- Demo-Daten
- README/Startanleitung

Nicht Pflicht:

- echter Login
- komplexes Rechtesystem
- Echtzeit-Multiplayer
- vollstaendige Jira-Kompatibilitaet
- mobile App
- Zahlungsfunktionen

## Kernobjekte

### User

- id
- name
- email optional
- role

### Project

- id
- name
- description
- status
- deadline
- createdAt

### Task

- id
- projectId
- title
- description
- status
- priority
- assigneeId
- dueDate
- tags
- createdAt
- updatedAt

### Comment

- id
- taskId
- authorId
- text
- type: comment, decision, question, note
- createdAt

### Activity

- id
- taskId
- actorId
- action
- createdAt

## Ansichten

### Projektuebersicht

- Liste aller Projekte
- Fortschritt pro Projekt
- Demo-Projekt direkt sichtbar

### Projekt-Board

- Kanban-Spalten
- Aufgaben-Karten
- Filter nach Person, Prioritaet und Tag
- Statuswechsel per Drag-and-drop oder Button

### Aufgaben-Detail

- Titel
- Beschreibung
- Status
- Verantwortliche Person
- Kommentare
- Aktivitaetsverlauf
- Entscheidungen/offene Fragen

### Dashboard

- offene Aufgaben
- erledigte Aufgaben
- Aufgaben pro Person
- Aufgaben nach Prioritaet
- Fortschritt in Prozent

## Bonusideen

- KI erzeugt Aufgaben aus Stichpunkten
- KI teilt grosse Aufgaben in kleinere Schritte
- KI fasst Projektstand zusammen
- Knowledge Base fuer Entscheidungen und Spezifikationen
- Export als JSON oder CSV
- GitHub-Issues verlinken

## Akzeptanzsignal

Die Demo ist ausreichend, wenn eine Person ohne Erklaerung diesen Ablauf schafft:

1. Demo-Projekt oeffnen.
2. Board verstehen.
3. Aufgabe erstellen.
4. Person zuweisen.
5. Status aendern.
6. Kommentar oder Entscheidung sehen.
7. Fortschritt erkennen.
