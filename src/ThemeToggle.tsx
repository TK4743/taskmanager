import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export type ThemeMode = 'light' | 'dark';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('it_taskmanager_theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  const root = document.documentElement;
  
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  try {
    localStorage.setItem('it_taskmanager_theme', theme);
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#09090b' : '#ffffff');
    }
  } catch {}
}

export const ThemeToggle: React.FC<{ className?: string; showLabel?: boolean }> = ({
  className = '',
  showLabel = false
}) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = getInitialTheme();
    setTheme(current);
    applyTheme(current);
    setMounted(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('it_taskmanager_theme');
      if (!saved) {
        const newTheme: ThemeMode = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 animate-pulse ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      title={isDark ? 'Switch to Light Theme (☀️)' : 'Switch to Dark Theme (🌙)'}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm active:scale-95 ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {isDark ? (
          <Moon className="w-5 h-5 text-indigo-400 transform transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500 transform transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
