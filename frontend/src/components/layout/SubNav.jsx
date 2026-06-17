export default function SubNav({ activeFilter, onFilterChange, visible }) {
  const filters = [
    { key: 'all', label: 'Alle' },
    { key: 'recent', label: 'Aktuell' },
    { key: 'favorites', label: 'Favoriten' },
  ];

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-gray)]/20 bg-[var(--color-bg)] px-4 py-2.5">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`cursor-pointer rounded-md border px-4 py-1.5 text-sm font-medium transition-all duration-150 leading-none ${
            activeFilter === f.key
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-sm'
              : 'border-[var(--color-gray)]/30 text-[var(--color-gray)] bg-[var(--color-content)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
          }`}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
