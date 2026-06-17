import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_GROUP_ID,
  DEFAULT_USER_ID,
  analyzeAgent,
  createAgentFeedback,
  fetchAIFeed,
  fetchAgentItem,
} from '../../services/api.js';

export default function AIFeedPanel({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [working, setWorking] = useState(false);

  const loadFeed = useCallback(async (preferredId = '') => {
    setLoading(true);
    setError(false);
    try {
      const nextItems = await fetchAIFeed(DEFAULT_GROUP_ID);
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
  }, []);

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
    setWorking(true);
    try {
      const result = await analyzeAgent({
        groupId: DEFAULT_GROUP_ID,
        sourceType: 'thread',
        sourceId: 'thread-matrix-link',
        mode: 'mock',
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
    if (!selectedId) return;
    setWorking(true);
    try {
      await createAgentFeedback(selectedId, {
        userId: DEFAULT_USER_ID,
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
      className={`fixed bottom-6 right-6 z-1000 w-[440px] max-w-[92vw] rounded-lg bg-[var(--color-content)] shadow-xl transition-all duration-300 ${
        open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between rounded-t-lg bg-[var(--color-accent)] px-4 py-3 text-white">
        <h3 className="text-sm font-semibold">AI Feed</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={working}
            aria-label="Agent-Analyse erstellen"
            className="rounded border border-white/40 px-2 py-1 text-xs font-semibold disabled:opacity-60"
          >
            Analyse
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="AI Feed schliessen"
            className="cursor-pointer border-none bg-transparent text-lg leading-none text-white hover:opacity-80"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="grid max-h-[520px] min-h-[320px] grid-cols-[160px_1fr] overflow-hidden">
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
                  className={`w-full rounded border px-2 py-2 text-left text-xs transition-colors duration-150 ${
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
                  disabled={working}
                  onClick={() => handleFeedback(1)}
                  className="rounded border border-[var(--color-gray)]/25 px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-accent)] disabled:opacity-60"
                >
                  Hilft
                </button>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => handleFeedback(-1)}
                  className="rounded border border-[var(--color-gray)]/25 px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-accent)] disabled:opacity-60"
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
          <li key={task} className="rounded border border-[var(--color-gray)]/15 px-3 py-2">
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
