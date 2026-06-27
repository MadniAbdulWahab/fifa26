import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="rounded-lg p-2 text-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
