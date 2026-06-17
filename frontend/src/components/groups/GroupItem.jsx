import Icon from '../common/Icon.jsx';

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
          <Icon name="folder" size={16} className="shrink-0 text-[var(--color-gray)]" />
          <span>{group.name}</span>
        </span>
        <Icon
          name="chevronDown"
          size={14}
          className={`shrink-0 text-[var(--color-gray)] transition-transform duration-200 ${
            group.collapsed ? '' : 'rotate-180'
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          group.collapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
        }`}
      />
    </div>
  );
}
