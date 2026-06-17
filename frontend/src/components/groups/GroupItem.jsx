export default function GroupItem({ group, onToggle }) {
  return (
    <div className="group-item">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded border-none bg-transparent px-2 py-1.5 text-left text-xs font-medium text-[var(--color-fg)] transition-colors duration-150 hover:bg-[var(--color-accent)]/10 select-none"
        onClick={onToggle}
        aria-expanded={!group.collapsed}
      >
        <span className="flex items-center gap-2">
          <span>&#128193;</span>
          <span>{group.name}</span>
        </span>
        <span
          className={`text-[10px] transition-transform duration-200 ${
            group.collapsed ? '' : 'rotate-180'
          }`}
        >
          &#9660;
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          group.collapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
        }`}
      >
        <div className="pl-8 text-xs text-[var(--color-gray)] py-1">
          Noch keine Eintr&auml;ge.
        </div>
      </div>
    </div>
  );
}
