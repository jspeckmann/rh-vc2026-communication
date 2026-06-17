// Zentrale ENV-Konfiguration. Austauschbare Ränder (Authentik, JWT-Claims)
// werden hier konfigurierbar gehalten, damit nach dem 11-Uhr-Meeting nur ENV
// angepasst werden muss — kein Code-Change.

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Fehlende Umgebungsvariable: ${name}`);
  return v;
}

export const config = {
  port: parseInt(process.env.PORT ?? '8002', 10),

  db: {
    host: req('PGHOST', 'files-db'),
    port: parseInt(process.env.PGPORT ?? '5432', 10),
    user: req('PGUSER', 'files'),
    password: req('PGPASSWORD', 'files'),
    database: req('PGDATABASE', 'files'),
  },

  // Physischer Speicherort der Dateien (Volume-Mount im Container).
  storageDir: process.env.STORAGE_DIR ?? '/data/files',

  // Verzeichnis des gemeinsamen Stylesheets (im Deploy via Gateway erreichbar).
  stylesDir: process.env.STYLES_DIR ?? '',

  auth: {
    // JWKS-Endpunkt von Authentik (OIDC). Wird nach dem 11-Uhr-Meeting final gesetzt.
    jwksUrl: process.env.AUTH_JWKS_URL ?? 'http://authentik-server:9000/auth/application/o/cpp/jwks/',
    issuer: process.env.AUTH_ISSUER ?? '',
    audience: process.env.AUTH_AUDIENCE ?? '',
    // Claim, aus dem die User-ID gelesen wird. Standard OIDC: 'sub'.
    subjectClaim: process.env.AUTH_SUBJECT_CLAIM ?? 'sub',
    // Wenn 'true', wird ein DEV-Header X-Debug-Sub akzeptiert (nur lokal!).
    allowDevHeader: (process.env.AUTH_ALLOW_DEV_HEADER ?? 'false') === 'true',
  },
};
