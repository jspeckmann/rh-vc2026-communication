export default function Breadcrumb({ label }) {
  return (
    <div className="ui-glass-bar px-5 py-3 text-sm text-[var(--color-gray)]">
      <span className="font-semibold text-[var(--color-fg)]">Kommunikation</span>
      <span className="mx-2 text-[var(--color-gray)]/70">/</span>
      <span>{label}</span>
    </div>
  );
}
