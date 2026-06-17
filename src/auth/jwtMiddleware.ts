import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { pool } from '../db/pool';
import { config } from '../config';

// Austauschbarer Rand: validiert das Authentik-OIDC-JWT über JWKS und
// extrahiert die User-ID (sub). Token-Details (issuer/audience/claim) kommen
// aus config und werden nach dem 11-Uhr-Meeting final gesetzt.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { sub: string; email?: string; name?: string };
    }
  }
}

const jwks = createRemoteJWKSet(new URL(config.auth.jwksUrl));

async function ensureUser(sub: string, email?: string, name?: string): Promise<void> {
  // Spiegel-User anlegen/aktualisieren (Owner-Referenz für Dateien).
  await pool.query(
    `INSERT INTO users (sub, email, display_name) VALUES ($1, $2, $3)
     ON CONFLICT (sub) DO UPDATE SET email = COALESCE(EXCLUDED.email, users.email),
                                     display_name = COALESCE(EXCLUDED.display_name, users.display_name)`,
    [sub, email ?? null, name ?? null]
  );
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // DEV-Modus (lokal, per ENV): X-Debug-Sub Header oder Auto-Login als dev-user.
  if (config.auth.allowDevHeader) {
    const sub = req.header('X-Debug-Sub') || 'dev-user';
    try {
      await ensureUser(sub);
    } catch {
      // DB ggf. nicht verfügbar — im Dev-Modus trotzdem durchlassen.
    }
    req.user = { sub };
    return next();
  }

  try {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Bearer-Token fehlt' });
      return;
    }
    const token = header.slice('Bearer '.length);

    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.auth.issuer || undefined,
      audience: config.auth.audience || undefined,
    });

    const sub = String(payload[config.auth.subjectClaim] ?? payload.sub ?? '');
    if (!sub) {
      res.status(401).json({ error: 'Kein Subject-Claim im Token' });
      return;
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const name = typeof payload.name === 'string' ? payload.name : undefined;
    await ensureUser(sub, email, name);
    req.user = { sub, email, name };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token-Validierung fehlgeschlagen' });
  }
}
