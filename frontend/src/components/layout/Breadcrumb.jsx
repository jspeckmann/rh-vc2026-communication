export default function Breadcrumb({ label }) {
  return (
    <div className="border-b border-[var(--color-gray)]/20 px-4 py-3 text-sm text-[var(--color-gray)]">
      Home &gt; <span className="font-semibold text-[var(--color-fg)]">{label}</span>
    </div>
  );
}
