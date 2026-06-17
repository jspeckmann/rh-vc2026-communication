# Dateimanagement API — Spezifikation

**Team 2 — CPP Hackathon**

Basis-URL (dev): `http://localhost:8002`  
Basis-URL (prod via Traefik): `/files`

---

## Authentifizierung

### Produktivmodus

```
Authorization: Bearer <OIDC-JWT-von-Authentik>
```

Jeder Request muss einen gültigen JWT-Bearer-Token im `Authorization`-Header
enthalten. Das Token wird via JWKS (`AUTH_JWKS_URL`) validiert.  
Fehlgeschlagene Validierung → `401 { "error": "Bearer-Token fehlt" }`.

### Dev-Modus

Wenn `AUTH_ALLOW_DEV_HEADER=true` gesetzt ist, wird **jeder Request ohne
Bearer-Token** automatisch als `dev-user` authentifiziert. Optional kann der
Header `X-Debug-Sub` gesetzt werden, um eine abweichende User-ID zu erzwingen.

---

## Endpunkte

### `GET /health`

Gesundheitscheck.

**Response** `200`
```json
{ "status": "ok" }
```

---

### `GET /files/projects`

Verfügbare Projekte auflisten. **Kein Auth** (Vorab-Information ohne
Projektkontext).

**Response** `200`
```json
{
  "projects": [
    { "id": 1, "name": "Projekt A" },
    { "id": 2, "name": "Projekt B" }
  ]
}
```

---

### `GET /files/projects/:projectId/files`

Alle Dateien eines Projekts (logische Sicht: aktuellste Version pro Dateiname).

**Auth** ✅ `requireAuth` + `requireProjectMember`

**Response** `200`
```json
{
  "files": [
    {
      "id": 3,
      "original_name": "readme.md",
      "current_version": 2,
      "updated_at": "2026-06-17T12:00:00.000Z"
    }
  ]
}
```

**Fehler**
| Status | Bedeutung |
|--------|-----------|
| 401    | nicht authentifiziert |
| 403    | kein Mitglied des Projekts |

---

### `POST /files/projects/:projectId/files`

Datei hochladen — legt eine neue Datei an oder erzeugt eine neue Version,
wenn der Dateiname im Projekt bereits existiert.

**Auth** ✅ `requireAuth` + `requireProjectMember`

**Request** `multipart/form-data`
| Feld    | Typ    | Beschreibung |
|---------|--------|-------------|
| `file`  | File   | **Pflicht.** Die hochzuladende Datei (max. 200 MB) |

Optional kann der Feldname `originalName` mitgesendet werden, um den
Originalnamen zu überschreiben (sonst wird `req.file.originalname` verwendet).

Der MIME-Type wird in dieser Reihenfolge ermittelt:
1. Vom Client gesendeter `Content-Type` (falls nicht `application/octet-stream`)
2. Extension-basierte MIME-Map (siehe Anhang)
3. `null` (in DB gespeichert, von `/content` nachkorrigiert)

**Response** `201`
```json
{
  "fileId": 42,
  "version": 3,
  "originalName": "bericht.pdf"
}
```

**Fehler**
| Status | Bedeutung |
|--------|-----------|
| 400    | Feld `file` fehlt |
| 401    | nicht authentifiziert |
| 403    | kein Mitglied des Projekts |
| 500    | Upload fehlgeschlagen (Disk-I/O oder DB) |

---

### `GET /files/projects/:projectId/files/:fileId/download`

Datei herunterladen. Liefert den Binärstream mit passendem
`Content-Disposition`-Header.

**Auth** ✅ `requireAuth` + `requireProjectMember`

**Query-Parameter**
| Name      | Typ    | Beschreibung |
|-----------|--------|-------------|
| `version` | number | **Optional.** Bestimmte Version (Standard: aktuellste) |
| `inline`  | –      | **Optional.** Wenn gesetzt → `Content-Disposition: inline` (für `<img>`, `<embed>`) |

**Response** `200`
- `Content-Type`: MIME-Type der Version (aus DB)
- `Content-Disposition`: `attachment; filename="…"` oder `inline; filename="…"`
- Body: Binärstream der Datei

**Fehler**
| Status | Bedeutung |
|--------|-----------|
| 400    | `version`-Parameter ungültig |
| 401    | nicht authentifiziert |
| 403    | kein Mitglied des Projekts |
| 404    | Version nicht gefunden |

---

### `GET /files/projects/:projectId/files/:fileId/content`

Dateiinhalt (als JSON) abrufen — für den Browser-Editor und die
Vorschau-Entscheidung im Frontend.

**Auth** ✅ `requireAuth` + `requireProjectMember`

**Query-Parameter**
| Name      | Typ    | Beschreibung |
|-----------|--------|-------------|
| `version` | number | **Optional.** Bestimmte Version (Standard: aktuellste) |

**Response** `200`
```json
{
  "content": "#!/bin/bash\necho 'Hallo Welt'\n",
  "fileName": "script.sh",
  "version": 2,
  "mimeType": "application/x-sh",
  "isText": true,
  "sizeBytes": 30
}
```

- `isText` wird durch Null-Byte-Detektion bestimmt: `!buffer.includes(0)`
- Bei Text-Dateien ist `content` UTF-8-kodiert
- Bei Binär-Dateien ist `content` Base64-kodiert
- `mimeType` wird dynamisch korrigiert: falls DB `application/octet-stream`
  oder `null` liefert, wird die Extension-basierte MIME-Map verwendet
  (siehe Anhang)

**Fehler**
| Status | Bedeutung |
|--------|-----------|
| 400    | `version`-Parameter ungültig |
| 401    | nicht authentifiziert |
| 403    | kein Mitglied des Projekts |
| 404    | Datei oder Version nicht gefunden |

---

### `PUT /files/projects/:projectId/files/:fileId/content`

Dateiinhalt überschreiben — erzeugt eine **neue Version**. Nur für
Text-Dateien sinnvoll (Binärdateien bitte via `POST` neu hochladen).

**Auth** ✅ `requireAuth` + `requireProjectMember`

**Request** `application/json`
```json
{
  "content": "#!/bin/bash\necho 'Neue Version'\n"
}
```

**Response** `200`
```json
{
  "fileId": 42,
  "version": 4,
  "originalName": "script.sh"
}
```

**Fehler**
| Status | Bedeutung |
|--------|-----------|
| 400    | Feld `content` (string) fehlt |
| 401    | nicht authentifiziert |
| 403    | kein Mitglied des Projekts |
| 404    | Datei nicht gefunden |
| 500    | Speichern fehlgeschlagen |

---

### `DELETE /files/projects/:projectId/files/:fileId`

Datei **und alle ihre Versionen** endgültig löschen.

Entfernt:
- Alle Zeilen aus `file_versions` (DB)
- Die logische Datei aus `files` (DB, via CASCADE)
- Alle physischen Dateien von der Festplatte

**Auth** ✅ `requireAuth` + `requireProjectMember`

**Response** `200`
```json
{
  "deleted": true,
  "fileId": 42
}
```

**Fehler**
| Status | Bedeutung |
|--------|-----------|
| 401    | nicht authentifiziert |
| 403    | kein Mitglied des Projekts |
| 500    | Löschen fehlgeschlagen (DB oder Disk) |

---

### `GET /files/projects/:projectId/files/:fileId/versions`

Versionshistorie einer Datei.

**Auth** ✅ `requireAuth` + `requireProjectMember`

**Response** `200`
```json
{
  "versions": [
    { "id": 10, "version": 2, "size_bytes": 2048, "uploaded_by": "dev-user", "uploaded_at": "2026-06-17T12:30:00Z" },
    { "id": 5,  "version": 1, "size_bytes": 1024, "uploaded_by": "dev-user", "uploaded_at": "2026-06-17T11:00:00Z" }
  ]
}
```

**Fehler**
| Status | Bedeutung |
|--------|-----------|
| 401    | nicht authentifiziert |
| 403    | kein Mitglied des Projekts |

---

## Versionierungslogik

1. `POST …/files` mit Dateiname `X`:
   - Existiert `X` noch nicht im Projekt → neue Datei, Version 1
   - Existiert `X` bereits → `current_version + 1`, neue `file_versions`-Zeile
2. `PUT …/content`:
   - Immer eine neue Version (identische Logik wie Upload)
3. `DELETE …/files/:fileId`:
   - Transaktional: DB-Zeilen + physische Dateien (Rollback bei Fehler)

---

## Anhang: Extension-basierte MIME-Map

Wird verwendet, wenn der Client keinen oder einen generischen
(`application/octet-stream`) MIME-Type sendet, sowie zur Korrektur alter
Dateien ohne korrekten MIME-Type in der DB.

| Extension | MIME-Type |
|-----------|-----------|
| `json` | `application/json` |
| `md` | `text/markdown` |
| `html`, `htm` | `text/html` |
| `css` | `text/css` |
| `js`, `mjs`, `jsx` | `application/javascript` |
| `ts`, `tsx` | `application/typescript` |
| `xml` | `application/xml` |
| `yaml`, `yml` | `application/yaml` |
| `sh`, `bash` | `application/x-sh` |
| `py` | `text/x-python` |
| `java` | `text/x-java` |
| `c`, `h`, `cpp`, `hpp` | `text/x-c` / `text/x-c++` |
| `php` | `text/x-php` |
| `rb` | `text/x-ruby` |
| `go` | `text/x-go` |
| `rs` | `text/x-rust` |
| `sql` | `application/sql` |
| `toml` | `application/toml` |
| `ini`, `env` | `text/x-ini` / `text/x-env` |
| `txt` | `text/plain` |
| `csv` | `text/csv` |
| `svg` | `image/svg+xml` |
| `png` | `image/png` |
| `jpg`, `jpeg` | `image/jpeg` |
| `gif` | `image/gif` |
| `webp` | `image/webp` |
| `bmp` | `image/bmp` |
| `avif` | `image/avif` |
| `ico` | `image/x-icon` |
| `pdf` | `application/pdf` |
| `doc`, `dot` | `application/msword` |
| `docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `xls`, `xlt` | `application/vnd.ms-excel` |
| `xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `ppt`, `pot` | `application/vnd.ms-powerpoint` |
| `pptx` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| `odt` | `application/vnd.oasis.opendocument.text` |
| `ods` | `application/vnd.oasis.opendocument.spreadsheet` |
| `odp` | `application/vnd.oasis.opendocument.presentation` |
| `odg` | `application/vnd.oasis.opendocument.graphics` |

---

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `PORT` | `8002` | HTTP-Port |
| `PGHOST` | `files-db` | PostgreSQL-Host |
| `PGPORT` | `5432` | PostgreSQL-Port |
| `PGUSER` | `files` | DB-Benutzer |
| `PGPASSWORD` | `files` | DB-Passwort |
| `PGDATABASE` | `files` | DB-Name |
| `STORAGE_DIR` | `/data/files` | Physikalischer Speicherort der Dateien |
| `STYLES_DIR` | `""` | Verzeichnis mit `Stylesheet.css` |
| `AUTH_JWKS_URL` | `http://authentik-server:9000/…` | JWKS-Endpunkt |
| `AUTH_ISSUER` | `""` | OIDC-Issuer |
| `AUTH_AUDIENCE` | `""` | OIDC-Audience |
| `AUTH_SUBJECT_CLAIM` | `sub` | JWT-Claim für die User-ID |
| `AUTH_ALLOW_DEV_HEADER` | `false` | Dev-Modus aktivieren (`true`) |
