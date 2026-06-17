import GroupItem from '../groups/GroupItem.jsx';

export default function Sidebar({
  onNavigate,
  onToggleAIFeed,
  onOpenModal,
  currentSection,
  groups,
  setGroups,
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
        <NavButton id="chat-btn" icon="&#128172;" label="Chat" active={currentSection === 'chat'} onClick={() => onNavigate('chat')} />
        <NavButton id="wiki-btn" icon="&#128218;" label="Wiki" active={currentSection === 'wiki'} onClick={() => onNavigate('wiki')} />
        <NavButton id="network-btn" icon="&#127760;" label="Vernetzungswolke" active={currentSection === 'network'} onClick={() => onNavigate('network')} />
        <NavButton
          id="ai-feed-btn"
          icon="&#129302;"
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
          className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs transition-colors duration-150 hover:bg-[var(--color-accent)]/10"
          onClick={() => handleItemClick(item)}
        >
          <span className="flex items-center gap-2">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </span>
          <button
            type="button"
            onClick={(e) => handleRemove(e, item.id)}
            className="cursor-pointer border-none bg-transparent text-xs text-[var(--color-gray)] hover:text-[var(--color-error)]"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
