import express from 'express';
import { join } from 'path';
import { config } from './config';
import { migrate } from './db/migrate';
import { ensureStorageDir } from './files/storage';
import { filesRouter } from './files/routes';
import { openapiSpec } from './openapi';

const app = express();
app.use(express.json());

// Health-Check (Team-Konvention).
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// Auch unter /files/health erreichbar (hinter Traefik-PathPrefix).
app.get('/files/health', (_req, res) => res.json({ status: 'ok' }));

// OpenAPI-Spec (Team-Konvention).
app.get('/openapi.json', (_req, res) => res.json(openapiSpec));
app.get('/files/openapi.json', (_req, res) => res.json(openapiSpec));

// REST-API. Traefik leitet /files an diesen Service — Routen sind unter /files gemountet.
app.use('/files', filesRouter);

// Root-Weiterleitung zum Frontend.
app.get('/', (_req, res) => res.redirect('/files/'));

// Gemeinsames Stylesheet (Team-Konvention). Im Deploy via Gateway unter /styles erreichbar.
// Lokal: STYLES_DIR muss auf das Rene-Verzeichnis zeigen.
if (config.stylesDir) {
  app.use('/styles', express.static(config.stylesDir));
}

// React-Frontend (Static Build) unter /files ausliefern.
const frontendDir = join(__dirname, '..', 'frontend', 'dist');
app.use('/files', express.static(frontendDir));

// SPA-Fallback: alle nicht-gematchten /files/*-Pfade liefern index.html
// (damit clientseitiges Routing funktioniert).
app.get('/files/*', (_req, res) => {
  res.sendFile(join(frontendDir, 'index.html'));
});

async function start(): Promise<void> {
  await migrate();
  await ensureStorageDir();
  app.listen(config.port, () => {
    console.log(`[server] Dateimanagement läuft auf :${config.port}`);
  });
}

start().catch((err) => {
  console.error('[server] Start fehlgeschlagen:', err);
  process.exit(1);
});
