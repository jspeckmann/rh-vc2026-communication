import { useEffect, useReducer } from 'react';
import { fetchAIFeed } from '../../services/api.js';

function feedReducer(state, action) {
  switch (action.type) {
    case 'load':
      return { ...state, loading: true, items: [] };
    case 'loaded':
      return { loading: false, items: action.items };
    case 'error':
      return { loading: false, items: [] };
    default:
      return state;
  }
}

export default function AIFeedPanel({ open, onClose }) {
  const [{ loading, items }, dispatch] = useReducer(feedReducer, {
    loading: true,
    items: [],
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    dispatch({ type: 'load' });
    fetchAIFeed()
      .then((data) => {
        if (cancelled) return;
        dispatch({ type: 'loaded', items: Array.isArray(data) ? data : [] });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' });
      });
    return () => { cancelled = true; };
  }, [open]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-1000 w-[350px] max-w-[90vw] rounded-lg bg-[var(--color-content)] shadow-xl transition-all duration-300 ${
        open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between rounded-t-lg bg-[var(--color-accent)] px-4 py-3 text-white">
        <h3 className="text-sm font-semibold">&zwj;&#129302; AI Feed</h3>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer border-none bg-transparent text-lg leading-none text-white hover:opacity-80"
        >
          &times;
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-[var(--color-gray)]">Lade Daten...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--color-gray)]">Keine Feed-Eintr&auml;ge.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="mb-4 last:mb-0">
              <h4 className="text-sm font-semibold">{item.title}</h4>
              <p className="mt-1 text-xs text-[var(--color-gray)]">{item.description}</p>
              <span className="mt-1 block text-xs text-[var(--color-accent)]">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
