import { useEffect, useMemo, useState } from 'react';
import {
  createWikiArticle,
  fetchWikiArticle,
  fetchWikiArticles,
  formatTime,
  updateWikiArticle,
} from '../../services/api.js';

const EMPTY_FORM = {
  title: '',
  body: '',
  tags: '',
  status: 'published',
};

const STATUS_OPTIONS = [
  { value: 'published', label: 'Veröffentlicht' },
  { value: 'draft', label: 'Entwurf' },
  { value: 'archived', label: 'Archiviert' },
];

function tagsFromInput(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formFromArticle(article) {
  if (!article) return EMPTY_FORM;
  return {
    title: article.title ?? '',
    body: article.body ?? '',
    tags: (article.tags ?? []).join(', '),
    status: article.status ?? 'published',
  };
}

export default function WikiSection({
  groups,
  users,
  selectedGroupId,
  onSelectGroup,
  selectedUserId,
  selectedUserKnown,
  selectedGroupKnown,
}) {
  const [articles, setArticles] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [articleDetails, setArticleDetails] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!selectedGroupId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setArticles([]);
        setSelectedArticleId('');
        setArticleDetails(null);
        setForm(EMPTY_FORM);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetchWikiArticles(selectedGroupId)
      .then((data) => {
        if (cancelled) return;
        setArticles(data);
        setSelectedArticleId(data[0]?.id ?? '');
        if (data.length === 0) {
          setArticleDetails(null);
          setForm(EMPTY_FORM);
        }
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
  }, [selectedGroupId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedArticleId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setArticleDetails(null);
        setForm(EMPTY_FORM);
      });
      return () => {
        cancelled = true;
      };
    }

    fetchWikiArticle(selectedArticleId)
      .then((article) => {
        if (!cancelled) {
          setArticleDetails(article);
          setForm(formFromArticle(article));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticleDetails(null);
          setForm(EMPTY_FORM);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedArticleId]);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const filteredArticles = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return articles;
    return articles.filter((article) => {
      const haystack = [article.title, ...(article.tags ?? [])].join(' ').toLowerCase();
      return haystack.includes(value);
    });
  }, [articles, query]);

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const refreshArticles = async (preferredId) => {
    const nextArticles = await fetchWikiArticles(selectedGroupId);
    setArticles(nextArticles);
    const nextSelectedId = nextArticles.some((article) => article.id === preferredId)
      ? preferredId
      : nextArticles[0]?.id ?? '';
    setSelectedArticleId(nextSelectedId);
    return nextSelectedId;
  };

  const handleNew = () => {
    setSelectedArticleId('');
    setArticleDetails(null);
    setForm(EMPTY_FORM);
    setSaveError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body || !selectedGroupKnown || !selectedUserKnown) return;

    const payload = {
      groupId: selectedGroupId,
      title,
      body,
      tags: tagsFromInput(form.tags),
      status: form.status,
    };

    setSaving(true);
    setSaveError('');
    try {
      if (selectedArticleId) {
        await updateWikiArticle(selectedArticleId, payload);
        await refreshArticles(selectedArticleId);
        const article = await fetchWikiArticle(selectedArticleId);
        setArticleDetails(article);
        setForm(formFromArticle(article));
      } else {
        const article = await createWikiArticle({
          ...payload,
          authorId: selectedUserId,
        });
        await refreshArticles(article.id);
        setArticleDetails(article);
        setForm(formFromArticle(article));
      }
      setLoadError(false);
    } catch (error) {
      setSaveError(error.message || 'Wiki-Artikel konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
      <section className="ui-panel min-h-0 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Wiki</h2>
          <span className="text-xs text-[var(--color-gray)]">{articles.length}</span>
        </div>

        <select
          aria-label="Wiki-Gruppe"
          value={selectedGroupKnown ? selectedGroupId : ''}
          onChange={(event) => onSelectGroup(event.target.value)}
          className="ui-input mb-3 w-full px-3 py-2 text-sm"
        >
          {groups.length === 0 ? <option value="">Keine Gruppen</option> : null}
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <input
          aria-label="Wiki suchen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Suchen"
          className="ui-input mb-3 w-full px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={handleNew}
          className="ui-button ui-button-secondary mb-3 w-full px-3 py-2 text-sm font-semibold hover:bg-[var(--color-accent)] hover:text-white"
        >
          Neuer Artikel
        </button>

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
                className={`w-full rounded-[8px] border px-3 py-3 text-left text-sm transition-colors duration-150 ${
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

      <article className="ui-panel min-h-0 overflow-y-auto p-5">
        <header className="mb-4 border-b border-[var(--color-gray)]/15 pb-3">
          <h1 className="text-xl font-semibold">
            {selectedArticleId ? articleDetails?.title ?? 'Artikel' : 'Neuer Artikel'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-gray)]">
            {articleDetails?.updatedAt ? <span>{formatTime(articleDetails.updatedAt)}</span> : null}
            {articleDetails?.authorId ? (
              <span>{usersById.get(articleDetails.authorId)?.displayName ?? articleDetails.authorId}</span>
            ) : (
              <span>{usersById.get(selectedUserId)?.displayName ?? selectedUserId}</span>
            )}
          </div>
        </header>

        <form className="max-w-3xl space-y-3" onSubmit={handleSave}>
          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <input
              aria-label="Wiki-Titel"
              value={form.title}
              onChange={(event) => handleFormChange('title', event.target.value)}
              placeholder="Titel"
              className="ui-input px-3 py-2 text-sm"
            />
            <select
              aria-label="Wiki-Status"
              value={form.status}
              onChange={(event) => handleFormChange('status', event.target.value)}
              className="ui-input px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <input
            aria-label="Wiki-Tags"
            value={form.tags}
            onChange={(event) => handleFormChange('tags', event.target.value)}
            placeholder="Tags, kommagetrennt"
            className="ui-input w-full px-3 py-2 text-sm"
          />
          <textarea
            aria-label="Wiki-Body"
            value={form.body}
            onChange={(event) => handleFormChange('body', event.target.value)}
            placeholder="Inhalt"
            rows={12}
            className="ui-input w-full px-3 py-2 text-sm leading-6"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!form.title.trim() || !form.body.trim() || !selectedUserKnown || !selectedGroupKnown || saving}
              className="ui-button ui-button-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedArticleId ? 'Aktualisieren' : 'Erstellen'}
            </button>
            {saveError ? <span className="text-xs text-[var(--color-error)]">{saveError}</span> : null}
            {!selectedUserKnown ? (
              <span className="text-xs text-[var(--color-error)]">Gültigen User wählen.</span>
            ) : null}
          </div>
        </form>
      </article>

      <aside className="ui-panel min-h-0 overflow-y-auto p-4">
        <div className="mb-4 border-b border-[var(--color-gray)]/15 pb-3">
          <h2 className="text-sm font-semibold">Metadaten</h2>
          <p className="mt-1 text-xs text-[var(--color-gray)]">Autor, Tags und Verknüpfungen</p>
        </div>
        <div className="space-y-4 text-sm">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Autor</h3>
            <div className="ui-card-row p-3">
              {usersById.get(articleDetails?.authorId)?.displayName ?? usersById.get(selectedUserId)?.displayName ?? selectedUserId}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Gruppe</h3>
            <div className="ui-card-row p-3">
              {groups.find((group) => group.id === selectedGroupId)?.name ?? 'Keine Gruppe'}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tagsFromInput(form.tags).length ? tagsFromInput(form.tags).map((tag) => (
                <span key={tag} className="ui-chip">{tag}</span>
              )) : <span className="text-xs text-[var(--color-gray)]">Keine Tags</span>}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Verknüpfungen</h3>
            <div className="space-y-2">
              <div className="ui-card-row p-3 text-xs text-[var(--color-gray)]">Thema: Release Planung</div>
              <div className="ui-card-row p-3 text-xs text-[var(--color-gray)]">Entscheidung: Chat-Layer bleibt getrennt vom Wissen</div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
