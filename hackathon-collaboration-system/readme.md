# Hackathon Collaboration System – Frontend

Dieses Projekt enthält das **Frontend** für das Collaboration System mit den folgenden Funktionen:

- **Chat** – Echtzeit-Nachrichten
- **Wiki** – Dokumentation
- **Vernetzungswolke** – Visualisierung von Teammitgliedern, Projekten und Skills (basierend auf Neo4j)
- **AI Feed** – KI-gestützte Echtzeit-Informationen
- **Darkmode** – Automatische/manuelle Umschaltung

# Collaboration System – Frontend (Team Stephanie)

Frontend für das **Hackathon Collaboration System** (Chat, Wiki, Vernetzungswolke, AI Feed).
**Kompatibel mit den Team-Konventionen** (siehe [TEAM-CONVENTIONS.md](../../TEAM-CONVENTIONS.md)).

---

## 📁 Dateistruktur

---

## 📁 Dateistruktur

hackathon-collaboration-system/
├── index.html          # Haupt-HTML-Datei
├── styles.css          # Alle Styles (Lightmode + Darkmode)
├── script.js           # Frontend-Logik (Navigation, AI Feed, Gruppen)
├── network.js          # D3.js-Graph-Logik (Vernetzungswolke)
└── README.md           # Diese Datei

---

## 🚀 Schnellstart

1. **Lokal ausführen**:
   - Einfach die `index.html` in einem Browser öffnen (z. B. mit `Live Server` in VS Code).

2. **Backend-Anbindung**:
   - **Chat/Wiki**: Ersetze die Platzhalter in `script.js` mit echten API-Aufrufen.
   - **Vernetzungswolke**: Passe die Daten in `network.js` an eure Neo4j-API an.
   - **AI Feed**: Implementiere `loadAIFeedData()` in `script.js` mit echten Daten.

---

## 🔧 Wichtige Funktionen

### Darkmode
- **Automatisch**: Erkennt die Betriebssystem-Einstellungen (`prefers-color-scheme: dark`).
- **Manuell**: Toggle-Button oben rechts (☀️/🌙).
- **Speicherung**: Nutzerpräferenz wird im `localStorage` gespeichert.

### Navigation
- **Hauptmenü**: Chat, Wiki, Vernetzungswolke, AI Feed.
- **Zuletzt geöffnet**: Dynamische Liste der zuletzt aufgerufenen Abschnitte.
- **Untergruppen**: Erstellbar über "+ Neue Untergruppe".

### AI Feed
- **Panel**: Öffnet sich unten rechts nach Klick auf "AI Feed".
- **Daten**: Aktuell statische Beispiele – ersetze `loadAIFeedData()` mit echten API-Aufrufen.

### Vernetzungswolke
- **D3.js**: Visualisiert Knoten (Personen, Projekte, Skills) und Beziehungen.
- **Daten**: Beispiel-Daten in `network.js` – ersetze mit Neo4j-API-Daten.

---

## 🛠️ Backend-Integration

### 1. Chat
```javascript
// Beispiel: Nachrichten laden
async function loadMessages() {
  const response = await fetch('/api/chat/messages');
  const messages = await response.json();
  // Render messages in #chat-messages
}

### 2. Wiki
// Beispiel: Wiki-Inhalte laden
async function loadWikiContent() {
  const response = await fetch('/api/wiki');
  const content = await response.json();
  // Render content in #wiki-content
}

### 3. Venetzungswolke
// Beispiel: Netzwerkdaten laden
async function loadNetworkData() {
  const response = await fetch('/api/network');
  const { nodes, links } = await response.json();
  // Update network.js mit den Daten
  initNetworkGraph({ nodes, links });
}

### 4. AI Feed
// Beispiel: AI Feed-Daten laden
async function loadAIFeedData() {
  const response = await fetch('/api/ai-feed');
  const feedItems = await response.json();
  // Render feed items in #ai-feed-content
  renderAIFeedItems(feedItems);
}

| Rolle | Aufgabe |
| --- | --- |
| Frontend | HTML/CSS/JS anpassen, UI/UX optimieren. |
| Backend | API-Endpunkte für Chat, Wiki, Netzwerk, AI Feed implementieren. |
| KI-Experte | Neo4j-Datenbank aufsetzen, AI Feed-Logik entwickeln. |

---
---
---
## **📥 Download-Links**
*(Die Dateien sind bereit zum Herunterladen – einfach kopieren oder als `.zip` speichern.)*

🔹 **[index.html](sandbox/index.html)**
🔹 **[styles.css](sandbox/styles.css)**
🔹 **[script.js](sandbox/script.js)**
🔹 **[network.js](sandbox/network.js)**
🔹 **[README.md](sandbox/README.md)**

---
---
## **💡 Hinweise für dein Team**
1. **Backend-Anbindung**:
   - Ersetzt die **Platzhalter-Daten** in `script.js` und `network.js` mit echten API-Aufrufen.
   - Beispiel-Endpunkte sind im `README.md` dokumentiert.

2. **Neo4j-Integration**:
   - Die Vernetzungswolke erwartet Daten im Format:
     ```json
     {
       "nodes": [{ "id": 1, "name": "Stephanie", "type": "person", "skills": [...] }],
       "links": [{ "source": 1, "target": 2, "type": "works_on" }]
     }
     ```

3. **AI Feed**:
   - Der AI Feed kann später mit **WebSockets** oder **Polling** für Echtzeit-Updates erweitert werden.

4. **Darkmode**:
   - Die Logik ist bereits implementiert – das Backend muss keine zusätzlichen Daten liefern.

---
---