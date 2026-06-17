// Schmaler API-Client gegen das eigene Backend unter /files.
// Token wird aus dem localStorage gelesen (vom CPP-Login gesetzt) — austauschbar.

const BASE = '/files';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('cpp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface FileRow {
  id: number;
  original_name: string;
  current_version: number;
  updated_at: string;
}

export interface VersionRow {
  id: number;
  version: number;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ProjectRow {
  id: number;
  name: string;
}

export async function listProjects(): Promise<ProjectRow[]> {
  const res = await fetch(`${BASE}/projects`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Projekte konnten nicht geladen werden');
  return (await res.json()).projects;
}

export async function listFiles(projectId: number): Promise<FileRow[]> {
  const res = await fetch(`${BASE}/projects/${projectId}/files`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Liste konnte nicht geladen werden');
  return (await res.json()).files;
}

export async function uploadFile(projectId: number, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/projects/${projectId}/files`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error('Upload fehlgeschlagen');
}

export async function listVersions(projectId: number, fileId: number): Promise<VersionRow[]> {
  const res = await fetch(`${BASE}/projects/${projectId}/files/${fileId}/versions`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Versionen konnten nicht geladen werden');
  return (await res.json()).versions;
}

export function downloadUrl(projectId: number, fileId: number, version?: number): string {
  const q = version ? `?version=${version}` : '';
  return `${BASE}/projects/${projectId}/files/${fileId}/download${q}`;
}

export function previewUrl(projectId: number, fileId: number, version?: number): string {
  const q = version ? `?version=${version}&inline=1` : '?inline=1';
  return `${BASE}/projects/${projectId}/files/${fileId}/download${q}`;
}

export interface FileContent {
  content: string;
  fileName: string;
  version: number;
  mimeType: string | null;
  isText: boolean;
  sizeBytes: number;
}

export async function getFileContent(
  projectId: number,
  fileId: number,
  version?: number
): Promise<FileContent> {
  const q = version !== undefined ? `?version=${version}` : '';
  const res = await fetch(`${BASE}/projects/${projectId}/files/${fileId}/content${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Inhalt konnte nicht geladen werden');
  }
  return res.json();
}

export async function saveFileContent(
  projectId: number,
  fileId: number,
  content: string
): Promise<{ fileId: number; version: number; originalName: string }> {
  const res = await fetch(`${BASE}/projects/${projectId}/files/${fileId}/content`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Speichern fehlgeschlagen');
  return res.json();
}

export async function deleteFile(projectId: number, fileId: number): Promise<void> {
  const res = await fetch(`${BASE}/projects/${projectId}/files/${fileId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Löschen fehlgeschlagen');
}
