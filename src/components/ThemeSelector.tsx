'use client';

import { useTheme } from './ThemeProvider';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: '라이트', emoji: '☀️' },
    { value: 'dark', label: '다크', emoji: '🌙' },
    { value: 'zinc', label: 'Zinc', emoji: '⚪' },
    { value: 'orange', label: 'Orange', emoji: '🟠' },
    { value: 'blue', label: 'Blue', emoji: '🔵' },
  ] as const;

  return (
    <div className='flex gap-2'>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${
              theme === t.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }
          `}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );
}
