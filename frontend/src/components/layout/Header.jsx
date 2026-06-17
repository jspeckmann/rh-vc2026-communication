import Icon from '../common/Icon.jsx';

export default function Header({ theme, toggleTheme }) {
  return (
    <header className="absolute right-5 top-4 z-[1000]">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
        className="ui-icon-button flex h-10 w-10 cursor-pointer items-center justify-center text-base"
      >
        <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
      </button>
    </header>
  );
}
