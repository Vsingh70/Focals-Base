'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentPreset = {
  id: string;
  label: string;
  color: string; // for dark mode
  lightColor: string; // for light mode (often muted)
  mutedDark: string; // muted accent for dark
  mutedLight: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'sand',
    label: 'Sand',
    color: '#e8e0d0',
    lightColor: '#3a3530',
    mutedDark: '#3a3530',
    mutedLight: '#e8e0d0',
  },
  {
    id: 'sage',
    label: 'Sage',
    color: '#b8c5a8',
    lightColor: '#3d4a35',
    mutedDark: '#2d3528',
    mutedLight: '#d6e1c8',
  },
  {
    id: 'rose',
    label: 'Rose',
    color: '#e8c4c0',
    lightColor: '#5a3a36',
    mutedDark: '#3a2c2a',
    mutedLight: '#f0d8d4',
  },
  {
    id: 'sky',
    label: 'Sky',
    color: '#b8d0e0',
    lightColor: '#2c4555',
    mutedDark: '#28333d',
    mutedLight: '#d4e4f0',
  },
  {
    id: 'terracotta',
    label: 'Terracotta',
    color: '#d8a888',
    lightColor: '#6e3f25',
    mutedDark: '#3d2c20',
    mutedLight: '#ecd2bc',
  },
];

type ThemeContextValue = {
  mode: ThemeMode;
  accent: string;
  setMode: (m: ThemeMode) => void;
  setAccent: (id: string) => void;
  resolved: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_MODE = 'theme:mode';
const STORAGE_ACCENT = 'theme:accent';
const DEFAULT_MODE: ThemeMode = 'system';
const DEFAULT_ACCENT = 'sand';

function getSystemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode, accentId: string): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark';

  const resolved: 'light' | 'dark' =
    mode === 'system' ? getSystemPref() : mode;

  const root = document.documentElement;

  // Toggle the .light class — :root holds dark defaults, .light overrides.
  root.classList.toggle('light', resolved === 'light');

  const accent = ACCENT_PRESETS.find((a) => a.id === accentId) ?? ACCENT_PRESETS[0];
  if (resolved === 'dark') {
    root.style.setProperty('--color-accent', accent.color);
    root.style.setProperty('--color-accent-muted', accent.mutedDark);
  } else {
    root.style.setProperty('--color-accent', accent.lightColor);
    root.style.setProperty('--color-accent-muted', accent.mutedLight);
  }

  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage once on mount.
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_MODE) as ThemeMode | null;
      const savedAccent = localStorage.getItem(STORAGE_ACCENT);
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode);
      }
      if (savedAccent && ACCENT_PRESETS.some((a) => a.id === savedAccent)) {
        setAccentState(savedAccent);
      }
    } catch {
      // localStorage unavailable
    }
    setHydrated(true);
  }, []);

  // Re-apply whenever inputs change.
  useEffect(() => {
    if (!hydrated) return;
    setResolved(applyTheme(mode, accent));
  }, [mode, accent, hydrated]);

  // Watch system theme changes when in system mode.
  useEffect(() => {
    if (!hydrated || mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolved(applyTheme('system', accent));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, accent, hydrated]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_MODE, m);
    } catch {
      /* noop */
    }
  }, []);

  const setAccent = useCallback((id: string) => {
    setAccentState(id);
    try {
      localStorage.setItem(STORAGE_ACCENT, id);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, accent, setMode, setAccent, resolved }),
    [mode, accent, setMode, setAccent, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside a <ThemeProvider>');
  }
  return ctx;
}
