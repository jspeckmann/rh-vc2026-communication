import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../auth/jwtMiddleware';
import { requireProjectMember } from '../auth/membershipProvider';
import { handleUpload } from './uploadService';
import { listFiles, listVersions, getVersion, getFile, deleteFileTx } from './repository';
import { readStreamFromDisk, readBufferFromDisk, removeFromDisk } from './storage';

// REST-Endpunkte. Alle unter PathPrefix /files (Traefik), projektbezogen.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 200 } });

const extMimeMap: Record<string, string> = {
  json: 'application/json', md: 'text/markdown', html: 'text/html', htm: 'text/html',
  css: 'text/css', js: 'application/javascript', mjs: 'application/javascript',
  ts: 'application/typescript', tsx: 'application/typescript', jsx: 'application/javascript',
  xml: 'application/xml', yaml: 'application/yaml', yml: 'application/yaml',
  sh: 'application/x-sh', bash: 'application/x-sh', py: 'text/x-python',
  java: 'text/x-java', c: 'text/x-c', cpp: 'text/x-c++', h: 'text/x-c', hpp: 'text/x-c++',
  php: 'text/x-php', rb: 'text/x-ruby', go: 'text/x-go', rs: 'text/x-rust',
  sql: 'application/sql', toml: 'application/toml', ini: 'text/x-ini',
  env: 'text/x-env', txt: 'text/plain', csv: 'text/csv', svg: 'image/svg+xml',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', avif: 'image/avif', ico: 'image/x-icon',
  pdf: 'application/pdf',
  doc: 'application/msword', dot: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlt: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pot: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation',
  odg: 'application/vnd.oasis.opendocument.graphics',
};

export const filesRouter = Router();

// Alle Routen erfordern Auth + Projekt-Mitgliedschaft.
filesRouter.use('/projects/:projectId', requireAuth, requireProjectMember);

// Verfügbare Projekte auflisten (für die Projektauswahl im Frontend).
filesRouter.get('/projects', async (_req: Request, res: Response) => {
  const { rows } = await (await import('../db/pool')).pool.query<{ id: number; name: string }>(
    'SELECT id, name FROM projects ORDER BY name'
  );
  res.json({ projects: rows });
});

// Dateien eines Projekts auflisten (logische Sicht: Originalname + aktuelle Version).
filesRouter.get('/projects/:projectId/files', async (req: Request, res: Response) => {
  const files = await listFiles(Number(req.params.projectId));
  res.json({ files });
});

// Upload: neue Datei oder neue Version einer bestehenden.
filesRouter.post(
  '/projects/:projectId/files',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'Feld "file" fehlt (multipart/form-data)' });
      return;
    }
    const originalName = req.body.originalName || req.file.originalname;
    const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = req.file.mimetype && req.file.mimetype !== 'application/octet-stream'
      ? req.file.mimetype
      : extMimeMap[ext] ?? null;
    try {
      const result = await handleUpload({
        projectId: Number(req.params.projectId),
        userSub: req.user!.sub,
        originalName,
        buffer: req.file.buffer,
        mimeType,
        timestamp: Date.now(),
      });
      res.status(201).json(result);
    } catch (err) {
      console.error('[upload] Fehler:', err);
      res.status(500).json({ error: 'Upload fehlgeschlagen' });
    }
  }
);

// Versionshistorie einer logischen Datei.
filesRouter.get('/projects/:projectId/files/:fileId/versions', async (req: Request, res: Response) => {
  const versions = await listVersions(Number(req.params.projectId), Number(req.params.fileId));
  res.json({ versions });
});

// Download: bestimmte Version oder 'latest'. Liefert sauberen Originalnamen.
filesRouter.get('/projects/:projectId/files/:fileId/download', async (req: Request, res: Response) => {
  const projectId = Number(req.params.projectId);
  const fileId = Number(req.params.fileId);
  let version: number | 'latest' = 'latest';
  if (req.query.version !== undefined) {
    const n = Number(req.query.version);
    if (!Number.isInteger(n) || n < 1) {
      res.status(400).json({ error: 'Ungültiger version-Parameter' });
      return;
    }
    version = n;
  }
  const v = await getVersion(projectId, fileId, version);
  if (!v) {
    res.status(404).json({ error: 'Version nicht gefunden' });
    return;
  }
  const disposition = req.query.inline !== undefined ? 'inline' : 'attachment';
  const file = await getFile(projectId, fileId);
  const downloadName = file?.original_name ?? 'download';
  res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName}"`);
  if (v.mime_type) res.setHeader('Content-Type', v.mime_type);
  readStreamFromDisk(v.stored_path).pipe(res);
});

// Textinhalt einer Datei abrufen (für den Editor).
filesRouter.get('/projects/:projectId/files/:fileId/content', async (req: Request, res: Response) => {
  const projectId = Number(req.params.projectId);
  const fileId = Number(req.params.fileId);
  const file = await getFile(projectId, fileId);
  if (!file) {
    res.status(404).json({ error: 'Datei nicht gefunden' });
    return;
  }
  let version: number | 'latest' = 'latest';
  if (req.query.version !== undefined) {
    const n = Number(req.query.version);
    if (!Number.isInteger(n) || n < 1) {
      res.status(400).json({ error: 'Ungültiger version-Parameter' });
      return;
    }
    version = n;
  }
  const v = await getVersion(projectId, fileId, version);
  if (!v) {
    res.status(404).json({ error: 'Version nicht gefunden' });
    return;
  }
  const buffer = await readBufferFromDisk(v.stored_path);
  const isText = !buffer.includes(0);
  const ext = file.original_name.split('.').pop()?.toLowerCase() ?? '';
  const mime = v.mime_type && v.mime_type !== 'application/octet-stream'
    ? v.mime_type
    : extMimeMap[ext] ?? v.mime_type ?? (isText ? 'text/plain' : 'application/octet-stream');
  res.json({
    content: isText ? buffer.toString('utf-8') : buffer.toString('base64'),
    fileName: file.original_name,
    version: v.version,
    mimeType: mime,
    isText,
    sizeBytes: v.size_bytes,
  });
});

// Inhalt speichern (erzeugt neue Version).
filesRouter.put('/projects/:projectId/files/:fileId/content', async (req: Request, res: Response) => {
  const projectId = Number(req.params.projectId);
  const fileId = Number(req.params.fileId);
  const file = await getFile(projectId, fileId);
  if (!file) {
    res.status(404).json({ error: 'Datei nicht gefunden' });
    return;
  }
  const { content } = req.body;
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'Feld "content" (string) fehlt' });
    return;
  }
  const ext = file.original_name.split('.').pop()?.toLowerCase() ?? '';
  try {
    const result = await handleUpload({
      projectId,
      userSub: req.user!.sub,
      originalName: file.original_name,
      buffer: Buffer.from(content, 'utf-8'),
      mimeType: extMimeMap[ext] ?? 'text/plain',
      timestamp: Date.now(),
    });
    res.json(result);
  } catch (err) {
    console.error('[save] Fehler:', err);
    res.status(500).json({ error: 'Speichern fehlgeschlagen' });
  }
});

// Datei löschen (inkl. aller Versionen und physischer Dateien).
filesRouter.delete('/projects/:projectId/files/:fileId', async (req: Request, res: Response) => {
  const projectId = Number(req.params.projectId);
  const fileId = Number(req.params.fileId);
  try {
    const { storedPaths } = await deleteFileTx(projectId, fileId);
    await Promise.all(storedPaths.map(removeFromDisk));
    res.json({ deleted: true, fileId });
  } catch (err) {
    console.error('[delete] Fehler:', err);
    res.status(500).json({ error: 'Löschen fehlgeschlagen' });
  }
});
