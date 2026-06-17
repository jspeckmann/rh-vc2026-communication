import GroupItem from '../groups/GroupItem.jsx';

export default function Sidebar({
  onNavigate,
  onToggleAIFeed,
  onOpenModal,
  currentSection,
  groups,
  setGroups,
  groupsLoadError,
  recentItems,
  setRecentItems,
}) {

  const toggleCollapse = (id) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)),
    );
  };

  return (
    <nav className="flex w-72 flex-col border-r border-[var(--color-gray)]/20 bg-[var(--color-bg)]">
      <div className="border-b border-[var(--color-gray)]/20 px-4 py-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
          Hauptmen&uuml;
        </h3>
        <NavButton id="dashboard-btn" icon={'\u{1F4CA}'} label="Dashboard" active={currentSection === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        <NavButton id="groups-btn" icon={'\u{1F465}'} label="Gruppen" active={currentSection === 'groups'} onClick={() => onNavigate('groups')} />
        <NavButton id="chat-btn" icon={'\u{1F4AC}'} label="Chat" active={currentSection === 'chat'} onClick={() => onNavigate('chat')} />
        <NavButton id="wiki-btn" icon={'\u{1F4DA}'} label="Wiki" active={currentSection === 'wiki'} onClick={() => onNavigate('wiki')} />
        <NavButton id="network-btn" icon={'\u{1F310}'} label="Vernetzungswolke" active={currentSection === 'network'} onClick={() => onNavigate('network')} />
        <NavButton
          id="ai-feed-btn"
          icon={'\u{1F916}'}
          label="AI Feed"
          onClick={onToggleAIFeed}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
          Zuletzt ge&ouml;ffnet
        </h3>

        <RecentItems items={recentItems} onRemove={setRecentItems} onNavigate={onNavigate} />

        <button
          type="button"
          onClick={onOpenModal}
          className="mt-4 mb-4 cursor-pointer rounded border border-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-[var(--color-accent)] transition-colors duration-150 hover:bg-[var(--color-accent)] hover:text-white"
        >
          + Neue Untergruppe
        </button>

        <div className="flex flex-col gap-1">
          {groupsLoadError ? (
            <p className="px-2 py-1.5 text-xs text-[var(--color-error)]">Gruppen-Backend nicht erreichbar.</p>
          ) : null}
          {!groupsLoadError && groups.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-[var(--color-gray)]">Keine Gruppen.</p>
          ) : null}
          {groups.map((group) => (
            <GroupItem
              key={group.id}
              group={group}
              onToggle={() => toggleCollapse(group.id)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavButton({ id, icon, label, active, onClick }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full cursor-pointer items-center gap-3 rounded border-none bg-transparent px-4 py-3 text-left text-sm transition-colors duration-150 ${
        active ? 'bg-[var(--color-accent)]/15 font-semibold' : 'hover:bg-[var(--color-accent)]/10'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function RecentItems({ items, onRemove, onNavigate }) {
  const handleRemove = (e, id) => {
    e.stopPropagation();
    onRemove((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemClick = (item) => {
    if (item.id === 'ai-feed-btn') {
      onNavigate('ai-feed');
    } else if (item.route) {
      onNavigate(item.route);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded text-xs transition-colors duration-150 hover:bg-[var(--color-accent)]/10"
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-none bg-transparent px-2 py-1.5 text-left text-xs text-[var(--color-fg)]"
            onClick={() => handleItemClick(item)}
          >
            <span>{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleRemove(e, item.id)}
            aria-label={`${item.label} aus zuletzt geoeffnet entfernen`}
            className="cursor-pointer border-none bg-transparent text-xs text-[var(--color-gray)] hover:text-[var(--color-error)]"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
