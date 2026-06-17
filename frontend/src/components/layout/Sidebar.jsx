import GroupItem from '../groups/GroupItem.jsx';
import Icon from '../common/Icon.jsx';

export default function Sidebar({
  onNavigate,
  onToggleAIFeed,
  onOpenModal,
  currentSection,
  groups,
  setGroups,
  groupsLoadError,
}) {

  const toggleCollapse = (id) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)),
    );
  };

  return (
    <nav className="ui-sidebar flex flex-col">
      <div className="border-b border-[var(--color-gray)]/20 px-4 py-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--color-accent)] text-sm font-black text-white shadow-sm">
            <Icon name="chat" className="h-5 w-5" />
          </div>
          <div>
            <strong className="block text-sm">Team-Kommunikation</strong>
            <span className="text-xs text-[var(--color-gray)]">Chat, Wissen, Aufgaben</span>
          </div>
        </div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
          Hauptmenü
        </h3>
        <NavButton id="dashboard-btn" icon="dashboard" label="Dashboard" active={currentSection === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        <NavButton id="groups-btn" icon="groups" label="Gruppen" active={currentSection === 'groups'} onClick={() => onNavigate('groups')} />
        <NavButton id="chat-btn" icon="chat" label="Chat" active={currentSection === 'chat'} onClick={() => onNavigate('chat')} />
        <NavButton id="wiki-btn" icon="wiki" label="Wiki" active={currentSection === 'wiki'} onClick={() => onNavigate('wiki')} />
        <NavButton id="network-btn" icon="network" label="Vernetzungswolke" active={currentSection === 'network'} onClick={() => onNavigate('network')} />
        <NavButton
          id="ai-feed-btn"
          icon="ai"
          label="Assistenz"
          onClick={onToggleAIFeed}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <button
          type="button"
          onClick={onOpenModal}
          className="ui-button ui-button-secondary mt-4 mb-4 cursor-pointer px-3 py-2 text-xs font-semibold"
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
      className={`ui-nav-item cursor-pointer ${active ? 'ui-nav-item-active' : ''}`}
    >
      <Icon name={icon} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}
