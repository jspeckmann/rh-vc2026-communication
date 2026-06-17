# Dateimanagement (CPP Team 2)

Versionierter Fileserver für die Collaboration & Planning Platform.
Node.js + TypeScript + Express + PostgreSQL, React-Frontend (Vite).
Route `/files`, Port `8002`.

## Features

- Mandantenfähig: Dateien gehören Projekten; Zugriff nur für Projektmitglieder.
- Automatische Versionierung: erneuter Upload gleichen Namens → neue Version.
- Physisches Schema `[sub]_[timestamp]_[originalname]`, UI zeigt nur Originalname.
- REST-API + minimales React-Frontend, beide unter `/files`.
- Team-Konventionen: `GET /health`, `GET /openapi.json`, Traefik-Labels, gemeinsames Stylesheet.

## Lokal starten

```bash
cp .env.example .env
docker compose up --build
```

- API:        http://localhost:8002/files/projects/1/files
- Health:     http://localhost:8002/health
- OpenAPI:    http://localhost:8002/openapi.json

Lokal ist `AUTH_ALLOW_DEV_HEADER=true` gesetzt — Requests mit Header
`X-Debug-Sub: <user>` umgehen die JWT-Prüfung. Im Deploy auf `false`.

### Beispiel ohne echtes Auth (lokal)

```bash
# Projekt + Mitgliedschaft anlegen (einmalig, in der DB)
docker exec -it files-db psql -U files -d files -c \
  "INSERT INTO projects (name) VALUES ('Demo');
   INSERT INTO users (sub) VALUES ('demo') ON CONFLICT DO NOTHING;
   INSERT INTO project_members (project_id, user_sub, role) VALUES (1,'demo','owner');"

# Upload
curl -H "X-Debug-Sub: demo" -F "file=@./README.md" \
  http://localhost:8002/files/projects/1/files
```

## Architektur

```
src/
  server.ts                 Express-Bootstrap, /health, OpenAPI, Static-Frontend
  config.ts                 ENV-Parsing
  db/{pool,migrate,schema.sql}
  auth/jwtMiddleware.ts      JWKS-Validierung (austauschbarer Rand)
  auth/membershipProvider.ts Projekt-Rechte (austauschbarer Rand)
  files/{routes,uploadService,storage,repository}.ts
  openapi.ts
frontend/                   React (Vite) → unter /files serviert
```

## Deploy (Orchestrator)

`docker-compose.snippet.yml` enthält den Service-Block zum Einfügen in das
Orchestrator-Repo (VibeCodedAdministration). Dort `AUTH_ALLOW_DEV_HEADER=false`
und die finalen Authentik-Werte setzen.

### Gateway-Registrierung

Nach dem Deploy in `modules.json` (Orchestrator-Repo) folgenden Eintrag ergänzen:

```json
{
  "name": "Dateimanagement",
  "team": 2,
  "route": "/files",
  "healthCheck": "http://team2-dateimanagement:8002/health",
  "docsUrl": "http://team2-dateimanagement:8002/openapi.json"
}
```

### Authentik-Integration

Der Authentik-Service wird im Orchestrator-Compose betrieben, nicht in diesem
Repo. Lokal wird Auth über den `X-Debug-Sub`-Header umgangen
(`AUTH_ALLOW_DEV_HEADER=true`). Bei Deploy muss `AUTH_ALLOW_DEV_HEADER=false`
gesetzt sowie `AUTH_JWKS_URL`, `AUTH_ISSUER` und `AUTH_AUDIENCE` mit den finalen
Authentik-Werten belegt werden (siehe 11-Uhr-Meeting).
