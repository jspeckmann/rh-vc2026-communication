export default function SubNav({ activeFilter, onFilterChange, visible }) {
  const filters = [
    { key: 'all', label: 'Alle' },
    { key: 'recent', label: 'Aktuell' },
    { key: 'favorites', label: 'Favoriten' },
  ];

  if (!visible) return null;

  return (
    <div className="ui-glass-bar flex items-center gap-2 px-5 py-2.5">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`cursor-pointer rounded-[10px] border px-4 py-1.5 text-sm font-semibold transition-all duration-150 leading-none ${
            activeFilter === f.key
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-sm'
              : 'border-[var(--color-gray)]/20 text-[var(--color-gray)] bg-white/55 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
          }`}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
