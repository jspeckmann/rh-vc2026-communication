# Frontend – Hackathon Collaboration System

Dieses Verzeichnis enthält das **Frontend** des Hackathon Collaboration Systems. Es ist ein Teilprojekt des übergeordneten Repos und stellt die UI-Komponente für das Gesamtsystem bereit. Die Backend-Integration (API-Endpunkte, Datenbank, Authentifizierung) erfolgt in separaten Komponenten außerhalb dieses Verzeichnisses.

**Aktueller Status:** Frontend-Prototyp mit gemocktem Backend (statische Beispieldaten). Alle API-Aufrufe in `script.js` und `network.js` müssen durch echte Backend-Endpunkte ersetzt werden.

### Funktionen
- **Chat** – Echtzeit-Nachrichten (UI mit API-Platzhaltern)
- **Wiki** – Dokumentation (Statischer Inhalt, API ausstehend)
- **Vernetzungswolke** – D3.js-Visualisierung mit statischen Beispieldaten
- **AI Feed** – Panel mit statischen Beispieleinträgen
- **Darkmode** – Automatisch (OS) und manuell umschaltbar

---

## 📁 Dateistruktur

```
frontend/
├── index.html       # Einstiegspunkt
├── base.css         # Basis-Stylesheet (Variablen, Layout, Darkmode)
├── custom-styles.css# Projektspezifische Ergänzungen
├── script.js        # UI-Logik (Navigation, AI Feed, Gruppen, Chat)
├── network.js       # D3.js-Netzwerkvisualisierung
└── readme.md        # Diese Datei
```

---

## 🚀 Schnellstart

Öffne die `index.html` in einem Browser (z. B. mit Live Server in VS Code).  
Das Frontend läuft komplett clientseitig – kein Server erforderlich.

---

## 🔧 Backend-Integration

Ersetze die Platzhalter in `script.js` und `network.js` mit echten API-Aufrufen:

| Bereich | Endpunkt | Datei |
| --- | --- | --- |
| Chat | `POST /api/chat/messages` | `script.js` |
| Wiki | `GET /api/wiki` | `script.js` |
| Netzwerk | `GET /api/network` | `network.js` |
| AI Feed | `GET /api/ai-feed` | `script.js` |

---

## 📌 Hinweise

- **Kein Build-Tool** – reines HTML/CSS/JS, direkt im Browser ausführbar
- **Designsystem**: `base.css` definiert CSS-Variablen (Farben, Abstände, Schriften) als Grundlage für das projektweite Theming. Kann später durch ein gemeinsames Stylesheet des Gesamtprojekts ersetzt werden.
- Die Vernetzungswolke basiert auf **D3.js** (via CDN geladen)