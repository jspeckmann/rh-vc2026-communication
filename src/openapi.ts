// OpenAPI-Spec gemäß Team-Konvention (GET /openapi.json).
export const openapiSpec = {
  openapi: '3.0.3',
  info: { title: 'CPP Dateimanagement (Team 2)', version: '1.0.0' },
  servers: [{ url: '/files' }],
  paths: {
    '/health': {
      servers: [{ url: '/' }],
      get: { summary: 'Health-Check', responses: { '200': { description: 'ok' } } },
    },
    '/openapi.json': {
      servers: [{ url: '/' }],
      get: { summary: 'OpenAPI-Spec', responses: { '200': { description: 'ok' } } },
    },
    '/projects': {
      get: {
        summary: 'Verfügbare Projekte auflisten',
        responses: { '200': { description: 'Projektliste' } },
      },
    },
    '/projects/{projectId}/files': {
      get: {
        summary: 'Dateien des Projekts auflisten',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Liste logischer Dateien' } },
      },
      post: {
        summary: 'Datei hochladen (neue Datei oder neue Version)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' }, originalName: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'Version angelegt' } },
      },
    },
    '/projects/{projectId}/files/{fileId}/versions': {
      get: {
        summary: 'Versionshistorie',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Versionen absteigend' } },
      },
    },
    '/projects/{projectId}/files/{fileId}/download': {
      get: {
        summary: 'Datei herunterladen (version oder latest)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Dateiinhalt' }, '404': { description: 'nicht gefunden' } },
      },
    },
    '/projects/{projectId}/files/{fileId}/content': {
      get: {
        summary: 'Dateiinhalt abrufen',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Dateiinhalt als JSON' }, '404': { description: 'nicht gefunden' } },
      },
      put: {
        summary: 'Textinhalt speichern und neue Version erzeugen',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Version angelegt' }, '400': { description: 'ungueltiger Inhalt' } },
      },
    },
    '/projects/{projectId}/files/{fileId}': {
      delete: {
        summary: 'Datei inklusive aller Versionen loeschen',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'geloescht' }, '404': { description: 'nicht gefunden' } },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
};
