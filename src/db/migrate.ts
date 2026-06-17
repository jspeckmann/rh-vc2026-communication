import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './pool';

// Führt schema.sql idempotent aus. Wird beim Server-Start aufgerufen.
export async function migrate(): Promise<void> {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(sql);
  console.log('[migrate] Schema angewendet.');
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migrate] Fehler:', err);
      process.exit(1);
    });
}
