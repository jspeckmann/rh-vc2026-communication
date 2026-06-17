import { useCallback, useEffect, useState } from 'react';
import {
  analyzeAgent,
  createAgentFeedback,
  fetchAIFeed,
  fetchAgentItem,
} from '../../services/api.js';

export default function AIFeedPanel({
  open,
  onClose,
  selectedGroupId,
  selectedUserId,
  selectedUserKnown,
}) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [working, setWorking] = useState(false);

  const loadFeed = useCallback(async (preferredId = '') => {
    if (!selectedGroupId) {
      setItems([]);
      setSelectedId('');
      setSelectedItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const nextItems = await fetchAIFeed(selectedGroupId);
      const nextSelectedId = nextItems.some((item) => item.id === preferredId)
        ? preferredId
        : nextItems[0]?.id ?? '';
      setItems(nextItems);
      setSelectedId(nextSelectedId);
      if (!nextSelectedId) setSelectedItem(null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loadFeed();
    });
    return () => {
      cancelled = true;
    };
  }, [loadFeed, open]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !selectedId) {
      return () => {
        cancelled = true;
      };
    }

    fetchAgentItem(selectedId)
      .then((item) => {
        if (!cancelled) setSelectedItem(item);
      })
      .catch(() => {
        if (!cancelled) setSelectedItem(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedId]);

  const handleAnalyze = async () => {
    if (!selectedGroupId) return;
    const sourceType = selectedItem?.sourceType ?? 'group';
    const sourceId = selectedItem?.sourceId ?? selectedGroupId;
    setWorking(true);
    try {
      const result = await analyzeAgent({
        groupId: selectedGroupId,
        sourceType,
        sourceId,
      });
      const createdId = result.createdItems?.[0]?.id ?? selectedId;
      await loadFeed(createdId);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setWorking(false);
    }
  };

  const handleFeedback = async (value) => {
    if (!selectedId || !selectedUserKnown) return;
    setWorking(true);
    try {
      await createAgentFeedback(selectedId, {
        userId: selectedUserId,
        value,
        reason: null,
      });
      setSelectedItem(await fetchAgentItem(selectedId));
      await loadFeed(selectedId);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div
      className={`ui-modal-card fixed bottom-6 right-6 z-[1000] w-[520px] max-w-[92vw] overflow-hidden transition-all duration-300 ${
        open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-gray)]/15 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">AI Feed</h3>
          <p className="text-xs text-[var(--color-gray)]">LLM-Agent / Mock-Fallback aktiv</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={working || !selectedGroupId}
            aria-label="Agent-Analyse erstellen"
            className="ui-button ui-button-primary px-2 py-1 text-xs font-semibold disabled:opacity-60"
          >
            Analyse
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="AI Feed schliessen"
            className="cursor-pointer border-none bg-transparent text-lg leading-none text-[var(--color-gray)] hover:text-[var(--color-fg)]"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="grid max-h-[560px] min-h-[340px] grid-cols-[180px_1fr] overflow-hidden max-sm:grid-cols-1">
        <aside className="overflow-y-auto border-r border-[var(--color-gray)]/15 p-3">
          {loading ? (
            <p className="text-sm text-[var(--color-gray)]">Lade Daten...</p>
          ) : error ? (
            <p className="text-sm text-[var(--color-error)]">Backend nicht erreichbar.</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-[var(--color-gray)]">Keine Feed-Eintraege.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-current={item.id === selectedId ? 'page' : undefined}
                  className={`w-full rounded-[8px] border px-2 py-2 text-left text-xs transition-colors duration-150 ${
                    item.id === selectedId
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                      : 'border-[var(--color-gray)]/15 hover:border-[var(--color-accent)]'
                  }`}
                >
                  <strong className="block">{item.title}</strong>
                  <span className="mt-1 block text-[var(--color-gray)]">{item.status}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="overflow-y-auto p-4">
          {selectedItem ? (
            <div>
              <div className="mb-3 border-b border-[var(--color-gray)]/15 pb-3">
                <h4 className="text-sm font-semibold">{selectedItem.title}</h4>
                <p className="mt-1 text-xs text-[var(--color-gray)]">
                  {selectedItem.itemType} / {selectedItem.priority} / {Math.round((selectedItem.confidence ?? 0) * 100)}%
                </p>
              </div>
              <AgentContent content={selectedItem.content} />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={working || !selectedUserKnown}
                  onClick={() => handleFeedback(1)}
                  className="ui-button px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-accent)] disabled:opacity-60"
                >
                  Hilft
                </button>
                <button
                  type="button"
                  disabled={working || !selectedUserKnown}
                  onClick={() => handleFeedback(-1)}
                  className="ui-button px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-accent)] disabled:opacity-60"
                >
                  Passt nicht
                </button>
                <span className="text-xs text-[var(--color-gray)]">
                  {selectedItem.feedback?.up ?? 0} / {selectedItem.feedback?.down ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-gray)]">Kein Agent-Item gewaehlt.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function AgentContent({ content }) {
  if (Array.isArray(content?.tasks)) {
    return (
      <ul className="space-y-2 text-sm">
        {content.tasks.map((task) => (
          <li key={task} className="ui-card-row px-3 py-2">
            {task}
          </li>
        ))}
      </ul>
    );
  }

  if (content?.summary || content?.reason) {
    return <p className="text-sm leading-6">{content.summary ?? content.reason}</p>;
  }

  return (
    <pre className="max-h-48 overflow-auto rounded border border-[var(--color-gray)]/15 p-3 text-xs">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
