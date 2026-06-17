import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

export default function AddGroupModal({ open, onClose, groups, setGroups }) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const duplicate = groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) return;

    const newGroup = {
      id: crypto.randomUUID(),
      name: trimmed,
      collapsed: false,
    };
    setGroups((prev) => [...prev, newGroup]);
    setName('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Neue Untergruppe erstellen">
      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name der Untergruppe"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          autoFocus
          className="w-full rounded border border-[var(--color-gray)]/30 bg-[var(--color-content)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Abbrechen
        </Button>
        <Button variant="success" onClick={handleCreate}>
          Erstellen
        </Button>
      </div>
    </Modal>
  );
}
