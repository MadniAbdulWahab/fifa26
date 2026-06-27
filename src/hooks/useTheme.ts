import { useCallback, useEffect, useState } from 'react';
import { readJson, writeJson } from '@/lib/storage';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'wc26:theme';

function apply(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    readJson<Theme>(STORAGE_KEY, 'dark'),
  );

  useEffect(() => {
    apply(theme);
    writeJson(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { theme, toggle };
}
