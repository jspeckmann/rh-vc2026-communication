import { useEffect, useState } from 'react';
import { fetchDashboard, formatTime } from '../../services/api.js';

const emptyDashboard = {
  status: {},
  groups: [],
  feed: [],
  wiki: [],
  agentFeed: [],
  knowledgeGraph: { nodeCount: 0, edgeCount: 0 },
};

export default function DashboardSection({ onNavigate }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((data) => {
        if (cancelled) return;
        setDashboard({ ...emptyDashboard, ...data });
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
            className="rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4 text-left shadow-sm transition-colors duration-150 hover:border-[var(--color-accent)]"
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
        <section className="min-h-0 rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4">
          <HeaderLine title="Status" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(dashboard.status ?? {}).map(([key, value]) => (
              <div key={key} className="rounded border border-[var(--color-gray)]/15 px-3 py-2">
                <span className="block text-xs uppercase tracking-wider text-[var(--color-gray)]">
                  {labelStatus(key)}
                </span>
                <strong className="text-sm">{value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <FeedList title="Operativer Feed" items={dashboard.feed ?? []} />
            <AgentList items={dashboard.agentFeed ?? []} />
          </div>
        </section>

        <section className="min-h-0 rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4">
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
        <article key={item.id} className="rounded border border-[var(--color-gray)]/15 px-3 py-2 text-sm">
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
    matrix: 'Matrix',
    llm: 'LLM',
    userAdapter: 'User',
  };
  return labels[key] ?? key;
}
