"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeSetting = Theme | "system";

const STORAGE_KEY = "ecourp-theme";
const DEFAULT_SETTING: ThemeSetting = "light";

type ThemeContextValue = {
  theme: Theme;
  setting: ThemeSetting;
  setSetting: (next: ThemeSetting | ((prev: ThemeSetting) => ThemeSetting)) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

function getStoredSetting(): ThemeSetting | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeSetting | null;
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // ignore
  }
  return null;
}

function resolveTheme(setting: ThemeSetting): Theme {
  return setting === "system" ? getSystemTheme() : setting;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSettingState] = useState<ThemeSetting>(DEFAULT_SETTING);
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(DEFAULT_SETTING));

  const setSetting = useCallback(
    (next: ThemeSetting | ((prev: ThemeSetting) => ThemeSetting)) => {
      setSettingState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          window.localStorage.setItem(STORAGE_KEY, resolved);
        } catch {
          // ignore
        }
        return resolved;
      });
    },
    []
  );

  useEffect(() => {
    const stored = getStoredSetting();
    if (stored) {
      if (stored !== setting) {
        setSettingState(stored);
      }
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, setting);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(setting);
    setTheme(resolved);
    applyTheme(resolved);
  }, [setting]);

  useEffect(() => {
    if (setting !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => {
      const resolved = getSystemTheme();
      setTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [setting]);

  const toggle = useCallback(() => {
    setSetting((prev) => {
      const resolved = prev === "system" ? getSystemTheme() : prev;
      return resolved === "dark" ? "light" : "dark";
    });
  }, [setSetting]);

  const value = useMemo(() => ({ theme, setting, setSetting, toggle }), [theme, setting, setSetting, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return value;
}

