import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  listProjects, listFiles, uploadFile, listVersions, downloadUrl, previewUrl,
  getFileContent, saveFileContent, deleteFile,
  FileRow, VersionRow, ProjectRow,
} from './api';

const CONCURRENCY = 4;

const IMAGE_MIMES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/bmp', 'image/avif',
]);

const OFFICE_EXTS = new Set([
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'odg',
]);

function isViewableImage(mime: string | null): boolean {
  return mime ? IMAGE_MIMES.has(mime) : false;
}

function isOfficeDoc(name: string, mime: string | null): boolean {
  if (mime && (
    mime.startsWith('application/vnd.openxmlformats-officedocument') ||
    mime.startsWith('application/vnd.oasis.opendocument') ||
    mime.startsWith('application/msword') ||
    mime.startsWith('application/vnd.ms-')
  )) return true;
  const ext = name.split('.').pop()?.toLowerCase();
  return ext ? OFFICE_EXTS.has(ext) : false;
}

const FileRowItem = memo(function FileRowItem({
  f, isActive, projectId, onOpen, onDelete, onToggleVersions, hasVersions, versions,
}: {
  f: FileRow; isActive: boolean; projectId: number;
  onOpen: (id: number) => void; onDelete: (id: number, name: string) => void;
  onToggleVersions: (id: number) => void; hasVersions: boolean;
  versions: VersionRow[] | undefined;
}) {
  return (
    <tr className={isActive ? 'active-row' : ''}>
      <td>{f.original_name}</td>
      <td>v{f.current_version}</td>
      <td>
        <button className="btn btn-sm" onClick={() => onOpen(f.id)}>Öffnen</button>{' '}
        <a className="btn btn-sm" href={downloadUrl(projectId, f.id)}>Download</a>{' '}
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(f.id, f.original_name)}>Löschen</button>{' '}
        <button className="btn btn-sm btn-secondary" onClick={() => onToggleVersions(f.id)}>
          {hasVersions ? '▼' : '▶'} Versionen
        </button>
        {versions && (
          <ul className="version-list">
            {versions.map((v) => (
              <li key={v.id}>
                v{v.version} — {(v.size_bytes / 1024).toFixed(1)} KB —{' '}
                <a href={downloadUrl(projectId, f.id, v.version)}>laden</a>
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
});

async function parallelUploads(projectId: number, files: File[]): Promise<{ ok: number; errors: string[] }> {
  let ok = 0;
  const errors: string[] = [];
  const queue = [...files];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push((async () => {
      while (true) {
        const file = queue.shift();
        if (!file) return;
        try {
          await uploadFile(projectId, file);
          ok++;
        } catch {
          errors.push(file.name);
        }
      }
    })());
  }
  await Promise.all(workers);
  return { ok, errors };
}

export function App() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [versions, setVersions] = useState<Record<number, VersionRow[]>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [dragCount, setDragCount] = useState(0);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [editorFileName, setEditorFileName] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorIsText, setEditorIsText] = useState(false);
  const [editorMimeType, setEditorMimeType] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorChanged, setEditorChanged] = useState(false);
  const [imgError, setImgError] = useState(false);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const msgTimerRef = useRef<ReturnType<typeof setTimeout>>();

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok });
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMsg(null), 5000);
  }

  useEffect(() => {
    listProjects()
      .then((list) => {
        setProjects(list);
        if (list.length > 0) setProjectId(list[0].id);
      })
      .catch((e) => showMsg((e as Error).message, false));
  }, []);

  async function refresh() {
    if (!projectId) return;
    setFilesLoading(true);
    try {
      setFiles(await listFiles(projectId));
    } catch (e) {
      showMsg((e as Error).message, false);
    } finally {
      setFilesLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    setEditingFileId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function uploadFiles(fileList: FileList | File[]) {
    if (!projectId) return;
    setUploading(true);
    const files = Array.from(fileList);
    const { ok, errors } = await parallelUploads(projectId, files);
    setUploading(false);
    if (ok > 0) showMsg(`${ok} Datei${ok > 1 ? 'en' : ''} hochgeladen`, true);
    if (errors.length > 0) showMsg(`Fehler bei: ${errors.join(', ')}`, false);
    await refresh();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      await uploadFiles(e.target.files);
    }
    e.target.value = '';
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragCount((c) => c + 1);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragCount((c) => Math.max(0, c - 1));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragCount(0);
    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  async function toggleVersions(fileId: number) {
    if (!projectId) return;
    if (versions[fileId]) {
      setVersions((v) => {
        const copy = { ...v };
        delete copy[fileId];
        return copy;
      });
      return;
    }
    const list = await listVersions(projectId, fileId);
    setVersions((v) => ({ ...v, [fileId]: list }));
  }

  async function openEditor(fileId: number) {
    if (!projectId) return;
    if (editingFileId !== null && editingFileId !== fileId && editorChanged) {
      if (!confirm('Ungespeicherte Änderungen verwerfen?')) return;
    }
    setEditingFileId(fileId);
    setEditorLoading(true);
    setImgError(false);
    setEditorChanged(false);
    try {
      const data = await getFileContent(projectId, fileId);
      setEditorFileName(data.fileName);
      setEditorContent(data.content);
      setEditorIsText(data.isText);
      setEditorMimeType(data.mimeType);
    } catch (err) {
      showMsg((err as Error).message, false);
      setEditingFileId(null);
    } finally {
      setEditorLoading(false);
    }
  }

  function onEditorChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditorContent(e.target.value);
    setEditorChanged(true);
  }

  async function saveEditor() {
    if (editingFileId === null || !projectId) return;
    try {
      const result = await saveFileContent(projectId, editingFileId, editorContent);
      setEditorChanged(false);
      showMsg(`v${result.version} gespeichert`, true);
      await refresh();
    } catch (err) {
      showMsg((err as Error).message, false);
    }
  }

  async function replaceVersion(file: File) {
    if (!projectId || editingFileId === null) return;
    setUploading(true);
    try {
      await uploadFile(projectId, file);
      showMsg(`Neue Version von "${file.name}" hochgeladen`, true);
      await refresh();
      await openEditor(editingFileId);
    } catch (err) {
      showMsg((err as Error).message, false);
    } finally {
      setUploading(false);
    }
  }

  function onReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) replaceVersion(file);
    e.target.value = '';
  }

  async function onDelete(fileId: number, fileName: string) {
    if (!projectId) return;
    if (!confirm(`"${fileName}" endgültig löschen?`)) return;
    try {
      await deleteFile(projectId, fileId);
      showMsg(`"${fileName}" gelöscht`, true);
      setVersions((v) => { const c = { ...v }; delete c[fileId]; return c; });
      if (editingFileId === fileId) closeEditor();
      await refresh();
    } catch (err) {
      showMsg((err as Error).message, false);
    }
  }

  function closeEditor() {
    if (editorChanged && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
    setEditingFileId(null);
    setEditorContent('');
    setEditorFileName('');
    setEditorMimeType(null);
    setEditorChanged(false);
    setImgError(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && editingFileId !== null) closeEditor();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingFileId, editorChanged]);

  const handleNewVersion = useCallback(() => {
    replaceInputRef.current?.click();
  }, []);

  return (
    <main style={{ padding: 'var(--spacing-xl)' }}>
      <h1>Dateimanagement</h1>

      <div className="mt-2">
        <label>
          Projekt:{' '}
          <select
            className="input-field"
            value={projectId ?? ''}
            onChange={(e) => setProjectId(Number(e.target.value))}
          >
            {projects.length === 0 && <option value="">Keine Projekte</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (ID {p.id})</option>
            ))}
          </select>
        </label>
      </div>

      <div
        className={`dropzone mt-2${dragCount > 0 ? ' drag-over' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <label className="btn">
          {uploading ? 'Lade hoch…' : 'Dateien auswählen'}
          <input type="file" multiple hidden onChange={onUpload} disabled={uploading} />
        </label>
        <span className="dropzone-hint">oder hier hineinziehen</span>
      </div>

      {msg && (
        <p className={msg.ok ? 'feedback-success mt-2' : 'feedback-error mt-2'}>{msg.text}</p>
      )}

      <table className="table-data mt-2">
        <thead>
          <tr>
            <th>Name</th>
            <th>Version</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filesLoading ? (
            <tr><td className="empty" colSpan={3}>Lade Dateiliste…</td></tr>
          ) : files.length === 0 ? (
            <tr><td className="empty" colSpan={3}>Keine Dateien in diesem Projekt.</td></tr>
          ) : files.flatMap((f) => {
            const rows: JSX.Element[] = [
              <FileRowItem
                key={f.id}
                f={f}
                isActive={editingFileId === f.id}
                projectId={projectId!}
                onOpen={openEditor}
                onDelete={onDelete}
                onToggleVersions={toggleVersions}
                hasVersions={!!versions[f.id]}
                versions={versions[f.id]}
              />,
            ];
            if (editingFileId === f.id) {
              rows.push(
                <tr key={`editor-${f.id}`}>
                  <td colSpan={3} style={{ padding: 0 }}>
                    <div className="editor">
                      <div className="editor-header">
                        <h3>{editorFileName}</h3>
                        {editorLoading && <span className="feedback-in-progress">Lade…</span>}
                      </div>
                      {!editorLoading && (
                        <>
                          {editorIsText ? (
                            <textarea
                              value={editorContent}
                              onChange={onEditorChange}
                            />
                          ) : isViewableImage(editorMimeType) ? (
                            <div className="preview">
                              {imgError ? (
                                <div className="preview preview-office">
                                  <p className="feedback-error">Bild konnte nicht geladen werden.</p>
                                  <a className="btn" href={downloadUrl(projectId!, editingFileId)}>Herunterladen</a>
                                </div>
                              ) : (
                                <img
                                  src={previewUrl(projectId!, editingFileId)}
                                  alt={editorFileName}
                                  onError={() => setImgError(true)}
                                />
                              )}
                            </div>
                          ) : editorMimeType === 'application/pdf' ? (
                            <div className="preview preview-pdf">
                              <embed src={previewUrl(projectId!, editingFileId)} type="application/pdf" />
                            </div>
                          ) : isOfficeDoc(editorFileName, editorMimeType) ? (
                            <div className="preview preview-office">
                              <div className="office-icon">{editorFileName.split('.').pop()?.toUpperCase()}</div>
                              <p><strong>{editorFileName}</strong></p>
                              <p>Office-Dokument — kann nicht im Browser bearbeitet werden.</p>
                              <a className="btn" href={downloadUrl(projectId!, editingFileId)}>Herunterladen</a>
                            </div>
                          ) : (
                            <div className="preview preview-office">
                              <p className="feedback-error">
                                Vorschau nicht verfügbar.{' '}
                                <a href={downloadUrl(projectId!, editingFileId)}>Datei herunterladen</a>
                              </p>
                            </div>
                          )}
                          <div className="editor-actions mt-2">
                            {editorIsText ? (
                              <button className="btn" onClick={saveEditor} disabled={!editorChanged}>
                                {editorChanged ? 'Speichern' : 'Gespeichert'}
                              </button>
                            ) : (
                              <button className="btn" onClick={handleNewVersion} disabled={uploading}>
                                {uploading ? 'Lade hoch…' : 'Neue Version hochladen'}
                              </button>
                            )}
                            <button className="btn btn-secondary" onClick={closeEditor}>Schließen</button>
                          </div>
                          <input
                            ref={replaceInputRef}
                            type="file"
                            hidden
                            onChange={onReplaceFile}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }
            return rows;
          })}
        </tbody>
      </table>
    </main>
  );
}
