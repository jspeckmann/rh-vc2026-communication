import { useEffect, useState } from 'react';
import { fetchDashboard, formatTime, rebuildFeed } from '../../services/api.js';

const emptyDashboard = {
  status: {},
  groups: [],
  feed: [],
  wiki: [],
  agentFeed: [],
  knowledgeGraph: { nodeCount: 0, edgeCount: 0 },
};

export default function DashboardSection({ onNavigate, selectedGroupId, selectedGroupKnown }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadDashboard = (cancelledRef = { current: false }) => {
    return fetchDashboard()
      .then((data) => {
        if (cancelledRef.current) return;
        setDashboard({ ...emptyDashboard, ...data });
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelledRef.current) setLoadError(true);
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });
  };

  useEffect(() => {
    const cancelledRef = { current: false };
    loadDashboard(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const handleRebuildFeed = async () => {
    if (!selectedGroupKnown || !selectedGroupId) return;
    setRebuilding(true);
    setActionMessage('');
    try {
      await rebuildFeed({ groupId: selectedGroupId });
      await loadDashboard();
      setActionMessage('Feed-Rebuild wurde angenommen.');
    } catch {
      setActionMessage('Feed-Rebuild konnte nicht gestartet werden.');
    } finally {
      setRebuilding(false);
    }
  };

  const metrics = [
    { key: 'groups', label: 'Gruppen', value: dashboard.groups?.length ?? 0, route: 'groups' },
    { key: 'feed', label: 'Feed', value: dashboard.feed?.length ?? 0, route: 'chat' },
    { key: 'wiki', label: 'Wiki', value: dashboard.wiki?.length ?? 0, route: 'wiki' },
    {
      key: 'graph',
      label: 'Graph',
      value: dashboard.knowledgeGraph?.nodeCount ?? 0,
      route: 'network',
      suffix: `${dashboard.knowledgeGraph?.edgeCount ?? 0} Kanten`,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-gray)]">Status, Gruppen, Feed und Wissensgraph auf einen Blick.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="ui-chip"><span className="ui-status-dot" /> Chat-Link: {formatStatusValue(dashboard.status?.matrix)}</span>
          <span className="ui-chip">Assistenz: {formatStatusValue(dashboard.status?.llm)}</span>
          <span className="ui-chip">User: {formatStatusValue(dashboard.status?.userAdapter)}</span>
          <button
            type="button"
            onClick={handleRebuildFeed}
            disabled={!selectedGroupKnown || rebuilding}
            className="ui-button ui-button-secondary px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rebuilding ? 'Feed...' : 'Feed neu bauen'}
          </button>
        </div>
      </div>

      {actionMessage ? (
        <p className="text-sm text-[var(--color-gray)]">{actionMessage}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-gray)]">Lade Dashboard...</p>
      ) : loadError ? (
        <p className="text-sm text-[var(--color-error)]">Dashboard konnte nicht geladen werden.</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            onClick={() => onNavigate(metric.route)}
            className="ui-panel p-4 text-left transition-colors duration-150 hover:border-[var(--color-accent)]"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
              {metric.label}
            </span>
            <strong className="mt-2 block text-2xl text-[var(--color-fg)]">{metric.value}</strong>
            {metric.suffix ? (
              <span className="mt-1 block text-xs text-[var(--color-gray)]">{metric.suffix}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="ui-panel min-h-0 p-4">
          <HeaderLine title="Status" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(dashboard.status ?? {}).map(([key, value]) => (
              <div key={key} className="ui-card-row px-3 py-2">
                <span className="block text-xs uppercase tracking-wider text-[var(--color-gray)]">
                  {labelStatus(key)}
                </span>
                <strong className="text-sm">{formatStatusValue(value)}</strong>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <FeedList title="Operativer Feed" items={dashboard.feed ?? []} />
            <AgentList items={dashboard.agentFeed ?? []} />
          </div>
        </section>

        <section className="ui-panel min-h-0 p-4">
          <HeaderLine title="Gruppen und Wiki" />
          <div className="space-y-4">
            <CompactList
              items={dashboard.groups ?? []}
              empty="Keine Gruppen."
              render={(group) => (
                <>
                  <strong>{group.name}</strong>
                  <span>{group.description}</span>
                </>
              )}
            />
            <CompactList
              items={dashboard.wiki ?? []}
              empty="Keine Wiki-Artikel."
              render={(article) => (
                <>
                  <strong>{article.title}</strong>
                  <span>{article.tags?.join(', ') || formatTime(article.updatedAt)}</span>
                </>
              )}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function formatStatusValue(value) {
  const labels = {
    link_configured: 'konfiguriert',
    not_configured: 'fehlt',
    mock: 'aktiv',
    dummy: 'verbunden',
    ok: 'ok',
    postgres: 'PostgreSQL',
  };
  return labels[value] ?? String(value ?? 'fehlt').replaceAll('_', ' ');
}

function HeaderLine({ title }) {
  return (
    <div className="mb-3 flex items-center justify-between border-b border-[var(--color-gray)]/15 pb-2">
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  );
}

function FeedList({ title, items }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
        {title}
      </h3>
      <CompactList
        items={items}
        empty="Kein Feed."
        render={(item) => (
          <>
            <strong>{item.title}</strong>
            <span>{item.summary}</span>
            <small className={item.priority === 'high' ? 'text-[var(--color-error)]' : 'text-[var(--color-gray)]'}>
              {item.priority}
            </small>
          </>
        )}
      />
    </div>
  );
}

function AgentList({ items }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
        Agent
      </h3>
      <CompactList
        items={items}
        empty="Keine Agent-Items."
        render={(item) => (
          <>
            <strong>{item.title}</strong>
            <span>{item.itemType} / {item.status}</span>
          </>
        )}
      />
    </div>
  );
}

function CompactList({ items, empty, render }) {
  if (!items.length) {
    return <p className="rounded border border-dashed border-[var(--color-gray)]/25 p-3 text-sm text-[var(--color-gray)]">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((item) => (
        <article key={item.id} className="ui-card-row px-3 py-2 text-sm">
          <div className="flex flex-col gap-1">{render(item)}</div>
        </article>
      ))}
    </div>
  );
}

function labelStatus(key) {
  const labels = {
    api: 'API',
    database: 'DB',
    matrix: 'Chat-Link',
    llm: 'Assistenz',
    userAdapter: 'User',
  };
  return labels[key] ?? key;
}
