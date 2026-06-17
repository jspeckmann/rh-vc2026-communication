import express from 'express';
import { config } from './config';
import { migrate } from './db/migrate';
import { ensureStorageDir } from './files/storage';
import { filesRouter } from './files/routes';
import { openapiSpec } from './openapi';

const app = express();
app.use(express.json());

// Health-Check (Team-Konvention).
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/openapi.json', (_req, res) => res.json(openapiSpec));

// REST-API unter /files (hinter Traefik oder Frontend-Proxy).
app.use('/files', filesRouter);

async function start(): Promise<void> {
  await migrate();
  await ensureStorageDir();
  app.listen(config.port, () => {
    console.log(`[server] Dateimanagement-API läuft auf :${config.port} unter /files`);
  });
}

start().catch((err) => {
  console.error('[server] Start fehlgeschlagen:', err);
  process.exit(1);
});
