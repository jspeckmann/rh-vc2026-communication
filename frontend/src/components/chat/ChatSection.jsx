import { useState, useRef, useEffect } from 'react';
import { fetchMessages, sendMessage as sendMsg } from '../../services/api.js';

export default function ChatSection({ filter }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    inputRef.current?.focus();
    fetchMessages()
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const tempId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: tempId, text, status: 'Sende...', timestamp: new Date().toISOString() }]);
    setInput('');

    try {
      await sendMsg(text);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'Gesendet' } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: 'Nicht gesendet' } : m,
        ),
      );
    }
  };

  const filtered = (() => {
    if (messages.length === 0) return messages;
    switch (filter) {
      case 'recent':
        return messages.slice(-5);
      case 'favorites':
        return [];
      default:
        return messages;
    }
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4">
        {loading ? (
          <p className="text-sm text-[var(--color-gray)]">Lade Nachrichten...</p>
        ) : loadError ? (
          <p className="text-sm text-[var(--color-error)]">Fehler beim Laden der Nachrichten.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-gray)]">Keine Nachrichten.</p>
        ) : (
          filtered.map((msg) => (
            <div key={msg.id} className="mb-3 last:mb-0">
              <p className="text-sm">{msg.text}</p>
              <span className="text-xs text-[var(--color-gray)]">
                {msg.status || 'Gesendet'}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nachricht eingeben..."
          className="flex-1 rounded border border-[var(--color-gray)]/30 bg-[var(--color-content)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="button"
          onClick={handleSend}
          className="cursor-pointer rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
        >
          Senden
        </button>
      </div>
    </div>
  );
}
