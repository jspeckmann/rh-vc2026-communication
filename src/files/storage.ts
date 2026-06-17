import { mkdir, writeFile, unlink, readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { config } from '../config';

// Physisches Schreiben/Lesen + Dateinamens-Schema [sub]_[ts]_[originalname].
// Der User sieht dieses Schema nie — nur Originalname + Versionshistorie.

function sanitize(name: string): string {
  // Pfad-Bestandteile und problematische Zeichen entfernen.
  return name.replace(/[\/\\]/g, '_').replace(/[^\w.\-]/g, '_');
}

export function buildStoredName(userSub: string, timestamp: number, originalName: string): string {
  return `${sanitize(userSub)}_${timestamp}_${sanitize(originalName)}`;
}

export async function ensureStorageDir(): Promise<void> {
  await mkdir(config.storageDir, { recursive: true });
}

export async function writeFileToDisk(storedName: string, data: Buffer): Promise<string> {
  await ensureStorageDir();
  const fullPath = join(config.storageDir, storedName);
  await writeFile(fullPath, data);
  return fullPath;
}

export async function removeFromDisk(storedName: string): Promise<void> {
  try {
    await unlink(join(config.storageDir, storedName));
  } catch {
    // Datei evtl. nie geschrieben — ignorieren (Rollback-Pfad).
  }
}

export function readStreamFromDisk(storedName: string) {
  return createReadStream(join(config.storageDir, storedName));
}

export async function readBufferFromDisk(storedName: string): Promise<Buffer> {
  return readFile(join(config.storageDir, storedName));
}
