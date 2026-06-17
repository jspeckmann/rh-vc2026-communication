import { useState, useEffect } from 'react';
import { fetchWikiContent } from '../../services/api.js';

export default function WikiSection() {
  const [content, setContent] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchWikiContent().then((data) => {
      if (cancelled) return;
      const text =
        typeof data === 'string'
          ? data
          : data
            ? JSON.stringify(data, null, 2)
            : 'Wiki ist noch leer.';
      setContent(text);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="h-full">
      <pre className="whitespace-pre-wrap rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4 text-sm">
        {content || 'Lade Wiki-Inhalte...'}
      </pre>
    </div>
  );
}
