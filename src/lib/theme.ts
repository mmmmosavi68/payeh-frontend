import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type Palette = "neutral" | "indigo";

const STORAGE_KEY = "theme";
const PALETTE_STORAGE_KEY = "palette";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function readPalette(): Palette {
  try {
    return localStorage.getItem(PALETTE_STORAGE_KEY) === "indigo" ? "indigo" : "neutral";
  } catch {
    return "neutral";
  }
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "dark" || (theme === "system" && prefersDark()) ? "dark" : "light";
}

function apply(theme: Theme) {
  const resolved = resolve(theme);
  const root = document.documentElement;

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

function applyPalette(palette: Palette) {
  document.documentElement.dataset.palette = palette;
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}
export function syncThemeFromStorage() {
  apply(readTheme());
  applyPalette(readPalette());
  notifyListeners();
}
function subscribe(onChange: () => void) {
  listeners.add(onChange);

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const handleMedia = () => {
    if (readTheme() === "system") {
      apply("system");
    }
    onChange();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      apply(readTheme());
      onChange();
    }

    if (event.key === PALETTE_STORAGE_KEY) {
      applyPalette(readPalette());
      onChange();
    }
  };

  media.addEventListener("change", handleMedia);
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", handleMedia);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): string {
  const theme = readTheme();
  const palette = readPalette();

  return `${theme}|${resolve(theme)}|${palette}`;
}

const getServerSnapshot = () => "system||neutral";

export function useTheme() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [theme, resolved, palette] = snapshot.split("|");

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // تم فقط برای همین صفحه اعمال می‌شود.
    }

    apply(next);
    notifyListeners();
  }, []);

  const setPalette = useCallback((next: Palette) => {
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      // پالت فقط برای همین صفحه اعمال می‌شود.
    }

    applyPalette(next);
    notifyListeners();
  }, []);

  return {
    theme: theme as Theme,
    resolvedTheme: resolved ? (resolved as "light" | "dark") : undefined,
    palette: palette as Palette,
    setTheme,
    setPalette,
  };
}
