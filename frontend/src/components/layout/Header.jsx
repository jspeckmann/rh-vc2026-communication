export default function Header({ theme, toggleTheme }) {
  return (
    <header className="absolute right-6 top-6 z-1000">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--color-gray)]/30 bg-[var(--color-content)] text-lg shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--color-accent)] hover:scale-110 active:scale-95"
      >
        <span className={theme === 'dark' ? 'block' : 'hidden'}>&#127769;</span>
        <span className={theme === 'dark' ? 'hidden' : 'block'}>&#9728;</span>
      </button>
    </header>
  );
}
