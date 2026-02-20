import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  textScale: number;       // 75–150 (%), drives font-size on <html>
  extendedTimers: boolean;
  skipMiniGames: boolean;
  colorBlindMode: boolean;
  screenReaderMode: boolean;
  soundCaptions: boolean;  // reserved for future audio
}

export interface DisplaySettings {
  theme: 'light' | 'dark';
  windowOpacity: number;   // 70–100 (%)
}

export interface AppSettings {
  accessibility: AccessibilitySettings;
  display: DisplaySettings;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const defaultSettings: AppSettings = {
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    textScale: 100,
    extendedTimers: false,
    skipMiniGames: false,
    colorBlindMode: false,
    screenReaderMode: false,
    soundCaptions: false,
  },
  display: {
    theme: 'light',
    windowOpacity: 95,
  },
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agencyrpg-settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    // Deep merge — handles new keys added in future updates
    return {
      accessibility: { ...defaultSettings.accessibility, ...(saved.accessibility ?? {}) },
      display: { ...defaultSettings.display, ...(saved.display ?? {}) },
    };
  } catch {
    return defaultSettings;
  }
}

// ─── Global Application ───────────────────────────────────────────────────────

export function applySettings(settings: AppSettings) {
  const { accessibility, display } = settings;
  const html = document.documentElement;
  const body = document.body;

  // Apply theme to both <html> and <body> so all CSS selectors cascade correctly
  html.setAttribute('data-theme', display.theme);
  body.setAttribute('data-theme', display.theme);

  // Toggle accessibility classes on both elements for maximum specificity
  html.classList.toggle('high-contrast', accessibility.highContrast);
  body.classList.toggle('high-contrast', accessibility.highContrast);

  html.classList.toggle('reduced-motion', accessibility.reducedMotion);
  body.classList.toggle('reduced-motion', accessibility.reducedMotion);

  html.classList.toggle('color-blind-mode', accessibility.colorBlindMode);
  body.classList.toggle('color-blind-mode', accessibility.colorBlindMode);

  // Text scale: 100% = browser default 16px.
  // textScale 100 → html 100% (16px), 125 → 125% (20px), 75 → 75% (12px).
  // All CSS uses rem units so this cascades to every font-size in the app.
  html.style.fontSize = `${accessibility.textScale}%`;

  // CSS custom properties
  html.style.setProperty('--window-opacity', String(display.windowOpacity / 100));
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SettingsContextValue {
  settings: AppSettings;
  updateAccessibility: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  updateDisplay: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = loadSettings();
    // Respect OS reduced-motion preference on first load
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      loaded.accessibility.reducedMotion = true;
    }
    return loaded;
  });

  // Apply + persist whenever settings change
  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply immediately on mount (catches any saved state)
  useEffect(() => {
    applySettings(settings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAccessibility = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings(prev => ({
        ...prev,
        accessibility: { ...prev.accessibility, [key]: value },
      }));
    },
    []
  );

  const updateDisplay = useCallback(
    <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
      setSettings(prev => ({
        ...prev,
        display: { ...prev.display, [key]: value },
      }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
    applySettings(defaultSettings);
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    if (!settings.accessibility.screenReaderMode) return;
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = 'sr-only';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }, [settings.accessibility.screenReaderMode]);

  return (
    <SettingsContext.Provider value={{ settings, updateAccessibility, updateDisplay, resetSettings, announceToScreenReader }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider');
  return ctx;
}
