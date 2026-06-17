const BASE =
  'cursor-pointer rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS = {
  primary: `${BASE} bg-[var(--color-accent)] text-white hover:opacity-90`,
  secondary: `${BASE} border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white`,
  success: `${BASE} bg-[var(--color-success)] text-white hover:opacity-90`,
};

export default function Button({ variant = 'primary', children, ...props }) {
  return (
    <button type="button" className={VARIANTS[variant] || VARIANTS.primary} {...props}>
      {children}
    </button>
  );
}
