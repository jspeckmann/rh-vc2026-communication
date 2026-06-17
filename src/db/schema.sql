-- Schritt 1: Datenbank-Design (PostgreSQL)
-- Idempotent: kann bei jedem Start ausgeführt werden.

-- users: gespiegelt aus Authentik via 'sub'. KEIN eigenes User-Management
-- (das macht Gruppe 5) — diese Tabelle dient nur als Owner-Referenz für Dateien.
CREATE TABLE IF NOT EXISTS users (
  sub          TEXT PRIMARY KEY,            -- Authentik 'sub' (OIDC subject)
  display_name TEXT,
  email        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- projects: eigene Tabelle, gekapselt hinter MembershipProvider.
-- Bei Integration mit Team 4/5 wird nur der Provider getauscht.
CREATE TABLE IF NOT EXISTS projects (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- project_members: Rechte-Mapping User <-> Projekt.
CREATE TABLE IF NOT EXISTS project_members (
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_sub   TEXT   NOT NULL REFERENCES users(sub)   ON DELETE CASCADE,
  role       TEXT   NOT NULL DEFAULT 'member',       -- 'owner' | 'member'
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_sub)
);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_sub);

-- files: logische Datei-Sicht für den User (sauberer Originalname pro Projekt).
CREATE TABLE IF NOT EXISTS files (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_name   TEXT   NOT NULL,                   -- vom User gesehener Name
  current_version INT    NOT NULL DEFAULT 0,         -- Nummer der neuesten Version
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Eine logische Datei pro (Projekt, Originalname): erneuter Upload = neue Version.
  UNIQUE (project_id, original_name)
);
CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);

-- file_versions: physische Datei-Sicht (Pfad, Zeitstempel, Version).
CREATE TABLE IF NOT EXISTS file_versions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  file_id       BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version       INT    NOT NULL,                     -- 1, 2, 3, ...
  stored_path   TEXT   NOT NULL,                     -- [sub]_[ts]_[name] auf Disk
  size_bytes    BIGINT NOT NULL,
  mime_type     TEXT,
  uploaded_by   TEXT   NOT NULL REFERENCES users(sub),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (file_id, version)
);
CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);
