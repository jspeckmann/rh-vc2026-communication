import { useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

export function useDarkMode() {
  const [theme, setTheme] = useLocalStorage('theme', null);

  const effective = useMemo(() => {
    if (theme) return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effective === 'dark');
  }, [effective]);

  useEffect(() => {
    if (theme) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.documentElement.classList.toggle('dark', mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  }, [setTheme]);

  return { theme: effective, toggleTheme };
}