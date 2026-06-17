const BASE =
  'ui-button cursor-pointer px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS = {
  primary: `${BASE} ui-button-primary hover:opacity-90`,
  secondary: `${BASE} ui-button-secondary hover:bg-[var(--color-accent)] hover:text-white`,
  success: `${BASE} bg-[var(--color-success)] text-white hover:opacity-90`,
};

export default function Button({ variant = 'primary', children, ...props }) {
  return (
    <button type="button" className={VARIANTS[variant] || VARIANTS.primary} {...props}>
      {children}
    </button>
  );
}
