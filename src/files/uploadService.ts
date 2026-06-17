import { pool } from '../db/pool';
import { insertVersionTx } from './repository';
import { buildStoredName, writeFileToDisk, removeFromDisk } from './storage';

// Schritt 3: Versionierungs- & Upload-Algorithmus.
// 1. Physischen Dateinamen [sub]_[ts]_[name] generieren
// 2. Datei auf Disk schreiben
// 3. DB-Transaktion (files + file_versions) mit Rollback bei Fehlern
//    — bei DB-Fehler wird die geschriebene Datei wieder von Disk entfernt.

export async function handleUpload(params: {
  projectId: number;
  userSub: string;
  originalName: string;
  buffer: Buffer;
  mimeType: string | null;
  // Zeitstempel wird vom Aufrufer übergeben (testbar, deterministisch).
  timestamp: number;
}): Promise<{ fileId: number; version: number; originalName: string }> {
  const storedName = buildStoredName(params.userSub, params.timestamp, params.originalName);

  // 1+2: physisch schreiben
  await writeFileToDisk(storedName, params.buffer);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { fileId, version } = await insertVersionTx(client, {
      projectId: params.projectId,
      originalName: params.originalName,
      storedPath: storedName,
      sizeBytes: params.buffer.length,
      mimeType: params.mimeType,
      uploadedBy: params.userSub,
    });
    await client.query('COMMIT');
    return { fileId, version, originalName: params.originalName };
  } catch (err) {
    await client.query('ROLLBACK');
    // Rollback auch physisch: geschriebene Datei entfernen.
    await removeFromDisk(storedName);
    throw err;
  } finally {
    client.release();
  }
}
