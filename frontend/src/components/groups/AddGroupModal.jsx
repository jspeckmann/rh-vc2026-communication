import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { createGroup } from '../../services/api.js';

export default function AddGroupModal({
  open,
  onClose,
  groups,
  setGroups,
  currentUserId,
  canCreate,
  onCreated,
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || !canCreate) return;

    const duplicate = groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) return;

    setSaving(true);
    setError('');
    try {
      const group = await createGroup({
        name: trimmed,
        description: `Untergruppe ${trimmed}`,
        createdByUserId: currentUserId,
      });
      setGroups((prev) => [...prev, { ...group, collapsed: false }]);
      onCreated?.(group);
      setName('');
      onClose();
    } catch {
      setError('Gruppe konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Neue Untergruppe erstellen">
      <div className="mb-4">
        <input
          type="text"
          aria-label="Name der Untergruppe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name der Untergruppe"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          autoFocus
          className="w-full rounded border border-[var(--color-gray)]/30 bg-[var(--color-content)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
        />
        {error ? <p className="mt-2 text-xs text-[var(--color-error)]">{error}</p> : null}
        {!canCreate ? (
          <p className="mt-2 text-xs text-[var(--color-error)]">Erst einen gueltigen User laden.</p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Abbrechen
        </Button>
        <Button variant="success" onClick={handleCreate} disabled={saving || !canCreate}>
          Erstellen
        </Button>
      </div>
    </Modal>
  );
}
