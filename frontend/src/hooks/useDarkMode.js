import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

export function useDarkMode() {
  const [theme, setTheme] = useLocalStorage('theme', null);

  const effective = (() => {
    if (theme) return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effective === 'dark');
  }, [effective]);

  const toggleTheme = useCallback(() => {
    const next = effective === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [effective, setTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (!theme) {
        document.documentElement.classList.toggle('dark', mq.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme: effective, toggleTheme };
}