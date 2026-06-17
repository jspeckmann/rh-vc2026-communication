# API — Dateimanagement (Team 2)

Base-Route (hinter Traefik): `/files`. Datenformat: JSON über REST.
Auth: `Authorization: Bearer <JWT>` (Authentik OIDC). Zugriff nur für Projektmitglieder.

## Konventions-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/health` | `{"status":"ok"}` |
| GET | `/openapi.json` | OpenAPI-Spec |

## Datei-Endpunkte

### Dateien auflisten
`GET /files/projects/{projectId}/files`

```json
{ "files": [
  { "id": 1, "original_name": "bericht.pdf", "current_version": 3, "updated_at": "..." }
] }
```

### Upload (neue Datei oder neue Version)
`POST /files/projects/{projectId}/files` — `multipart/form-data`, Feld `file` (optional `originalName`).

Existiert `originalName` im Projekt bereits, wird die Version erhöht statt überschrieben.

```json
{ "fileId": 1, "version": 4, "originalName": "bericht.pdf" }
```

### Versionshistorie
`GET /files/projects/{projectId}/files/{fileId}/versions`

```json
{ "versions": [
  { "id": 9, "version": 4, "size_bytes": 20481, "uploaded_by": "sub-123", "uploaded_at": "..." }
] }
```

### Download
`GET /files/projects/{projectId}/files/{fileId}/download?version=2`

Ohne `version` → neueste Version. Liefert die Datei mit sauberem Originalnamen
(`Content-Disposition`).

## Hinweise

- Physische Ablage: `[sub]_[timestamp]_[originalname]` (für User unsichtbar).
- DB-Transaktion über `files` + `file_versions` mit Rollback (inkl. Disk-Cleanup).
- `MembershipProvider` und JWT-Middleware sind austauschbare Ränder für die
  spätere Integration mit Gruppe 4/5 bzw. dem final fixierten Token-Format.
