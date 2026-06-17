import { PoolClient } from 'pg';
import { pool } from '../db/pool';

// Alle SQL-Queries zu files/file_versions. Hält SQL aus dem Service fern.

export interface FileRow {
  id: number;
  project_id: number;
  original_name: string;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface VersionRow {
  id: number;
  file_id: number;
  version: number;
  stored_path: string;
  size_bytes: number;
  mime_type: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

export async function listFiles(projectId: number): Promise<FileRow[]> {
  const { rows } = await pool.query<FileRow>(
    'SELECT * FROM files WHERE project_id = $1 ORDER BY original_name',
    [projectId]
  );
  return rows;
}

export async function listVersions(projectId: number, fileId: number): Promise<VersionRow[]> {
  const { rows } = await pool.query<VersionRow>(
    `SELECT v.* FROM file_versions v
     JOIN files f ON f.id = v.file_id
     WHERE v.file_id = $1 AND f.project_id = $2
     ORDER BY v.version DESC`,
    [fileId, projectId]
  );
  return rows;
}

export async function getVersion(
  projectId: number,
  fileId: number,
  version: number | 'latest'
): Promise<VersionRow | null> {
  const sql =
    version === 'latest'
      ? `SELECT v.* FROM file_versions v JOIN files f ON f.id = v.file_id
         WHERE v.file_id = $1 AND f.project_id = $2 ORDER BY v.version DESC LIMIT 1`
      : `SELECT v.* FROM file_versions v JOIN files f ON f.id = v.file_id
         WHERE v.file_id = $1 AND f.project_id = $2 AND v.version = $3`;
  const params = version === 'latest' ? [fileId, projectId] : [fileId, projectId, version];
  const { rows } = await pool.query<VersionRow>(sql, params);
  return rows[0] ?? null;
}

// Innerhalb einer Transaktion: logische Datei holen oder anlegen, Version
// hochzählen und file_versions-Eintrag schreiben. Gibt die neue Versionsnummer.
export async function insertVersionTx(
  client: PoolClient,
  params: {
    projectId: number;
    originalName: string;
    storedPath: string;
    sizeBytes: number;
    mimeType: string | null;
    uploadedBy: string;
  }
): Promise<{ fileId: number; version: number }> {
  const { rows: fileRows } = await client.query<{ id: number; current_version: number }>(
    `INSERT INTO files (project_id, original_name, current_version)
     VALUES ($1, $2, 0)
     ON CONFLICT (project_id, original_name) DO UPDATE SET updated_at = now()
     RETURNING id, current_version`,
    [params.projectId, params.originalName]
  );
  const fileId = fileRows[0].id;
  const nextVersion = fileRows[0].current_version + 1;

  await client.query(
    `INSERT INTO file_versions
       (file_id, version, stored_path, size_bytes, mime_type, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [fileId, nextVersion, params.storedPath, params.sizeBytes, params.mimeType, params.uploadedBy]
  );

  await client.query('UPDATE files SET current_version = $1, updated_at = now() WHERE id = $2', [
    nextVersion,
    fileId,
  ]);

  return { fileId, version: nextVersion };
}

export async function getFile(projectId: number, fileId: number): Promise<FileRow | null> {
  const { rows } = await pool.query<FileRow>(
    'SELECT * FROM files WHERE id = $1 AND project_id = $2',
    [fileId, projectId]
  );
  return rows[0] ?? null;
}

export async function deleteFileTx(
  projectId: number,
  fileId: number
): Promise<{ storedPaths: string[] }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: versions } = await client.query<{ stored_path: string }>(
      'SELECT stored_path FROM file_versions WHERE file_id = $1',
      [fileId]
    );
    const storedPaths = versions.map((v) => v.stored_path);

    const { rowCount } = await client.query(
      'DELETE FROM files WHERE id = $1 AND project_id = $2',
      [fileId, projectId]
    );
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      throw new Error('Datei nicht gefunden');
    }

    await client.query('COMMIT');
    return { storedPaths };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
