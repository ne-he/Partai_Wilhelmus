'use client';

import { useState, useEffect, useCallback } from 'react';
import { Theme, applyTheme } from '../theme';

const STORAGE_KEY = 'theme_prefs';
const DEFAULT_THEME: Theme = 'vintage';
const DEFAULT_ACCENT = '#c8a96e';

interface ThemePrefs {
  theme: Theme;
  accent: string;
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private browsing or quota exceeded — silently ignore
  }
}

function loadPrefs(): ThemePrefs {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return { theme: DEFAULT_THEME, accent: DEFAULT_ACCENT };
  try {
    const parsed = JSON.parse(raw) as Partial<ThemePrefs>;
    return {
      theme: parsed.theme ?? DEFAULT_THEME,
      accent: parsed.accent ?? DEFAULT_ACCENT,
    };
  } catch {
    return { theme: DEFAULT_THEME, accent: DEFAULT_ACCENT };
  }
}

export function useTheme() {
  const isSSR = typeof window === 'undefined';

  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  // Mount: load from localStorage and apply
  useEffect(() => {
    if (isSSR) return;
    const prefs = loadPrefs();
    setThemeState(prefs.theme);
    setAccentState(prefs.accent);
    applyTheme(prefs.theme, prefs.accent);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-apply whenever theme or accent changes (after initial mount)
  useEffect(() => {
    if (isSSR) return;
    applyTheme(theme, accent);
  }, [theme, accent, isSSR]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      const prefs: ThemePrefs = { theme: newTheme, accent };
      safeSetItem(STORAGE_KEY, JSON.stringify(prefs));
      applyTheme(newTheme, accent);
    },
    [accent]
  );

  const setAccent = useCallback(
    (hex: string) => {
      setAccentState(hex);
      const prefs: ThemePrefs = { theme, accent: hex };
      safeSetItem(STORAGE_KEY, JSON.stringify(prefs));
      document.documentElement.style.setProperty('--accent', hex);
    },
    [theme]
  );

  return { theme, accent, setTheme, setAccent };
}
