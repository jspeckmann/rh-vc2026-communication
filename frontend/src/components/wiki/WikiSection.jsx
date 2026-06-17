import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_GROUP_ID,
  fetchWikiArticle,
  fetchWikiArticles,
  formatTime,
} from '../../services/api.js';

export default function WikiSection() {
  const [articles, setArticles] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [articleDetails, setArticleDetails] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchWikiArticles(DEFAULT_GROUP_ID)
      .then((data) => {
        if (cancelled) return;
        setArticles(data);
        setSelectedArticleId(data[0]?.id ?? '');
        if (data.length === 0) setArticleDetails(null);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedArticleId) {
      return () => {
        cancelled = true;
      };
    }

    fetchWikiArticle(selectedArticleId)
      .then((article) => {
        if (!cancelled) setArticleDetails(article);
      })
      .catch(() => {
        if (!cancelled) setArticleDetails(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedArticleId]);

  const filteredArticles = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return articles;
    return articles.filter((article) => {
      const haystack = [article.title, ...(article.tags ?? [])].join(' ').toLowerCase();
      return haystack.includes(value);
    });
  }, [articles, query]);

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[340px_1fr]">
      <section className="min-h-0 overflow-y-auto rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Wiki</h2>
          <span className="text-xs text-[var(--color-gray)]">{articles.length}</span>
        </div>
        <input
          aria-label="Wiki suchen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Suchen"
          className="mb-3 w-full rounded border border-[var(--color-gray)]/25 bg-[var(--color-content)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />

        {loading ? (
          <p className="text-sm text-[var(--color-gray)]">Lade Wiki...</p>
        ) : loadError ? (
          <p className="text-sm text-[var(--color-error)]">Wiki konnte nicht geladen werden.</p>
        ) : filteredArticles.length === 0 ? (
          <p className="text-sm text-[var(--color-gray)]">Keine Artikel.</p>
        ) : (
          <div className="space-y-2">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => setSelectedArticleId(article.id)}
                aria-current={article.id === selectedArticleId ? 'page' : undefined}
                className={`w-full rounded border px-3 py-3 text-left text-sm transition-colors duration-150 ${
                  article.id === selectedArticleId
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-gray)]/15 hover:border-[var(--color-accent)]'
                }`}
              >
                <strong className="block">{article.title}</strong>
                <span className="mt-1 block truncate text-xs text-[var(--color-gray)]">
                  {article.tags?.join(', ') || formatTime(article.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <article className="min-h-0 overflow-y-auto rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-5">
        {articleDetails ? (
          <>
            <header className="mb-4 border-b border-[var(--color-gray)]/15 pb-3">
              <h1 className="text-xl font-semibold">{articleDetails.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-gray)]">
                <span>{articleDetails.status}</span>
                <span>{formatTime(articleDetails.updatedAt)}</span>
                <span>{articleDetails.authorId}</span>
              </div>
            </header>
            <div className="mb-4 flex flex-wrap gap-2">
              {(articleDetails.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-[var(--color-gray)]/20 px-2 py-1 text-xs text-[var(--color-gray)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="max-w-3xl whitespace-pre-wrap text-sm leading-6">{articleDetails.body}</p>
          </>
        ) : (
          <p className="text-sm text-[var(--color-gray)]">Kein Artikel gewaehlt.</p>
        )}
      </article>
    </div>
  );
}
