import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
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

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleMedia = () => {
    if (readTheme() === "system") apply("system");
    onChange();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      apply(readTheme());
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
  return `${theme}|${resolve(theme)}`;
}

// روی سرور (و هنگام hydration) تم هنوز مشخص نیست.
const getServerSnapshot = () => "system|";

export function useTheme() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, resolved] = snapshot.split("|");

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // حافظه‌ی مرورگر در دسترس نیست؛ تم فقط برای همین صفحه اعمال می‌شود.
    }
    apply(next);
    listeners.forEach((listener) => listener());
  }, []);

  return {
    theme: theme as Theme,
    resolvedTheme: resolved ? (resolved as "light" | "dark") : undefined,
    setTheme,
  };
}
