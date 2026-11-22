import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/app/globals.css',
  'src/app/[locale]/layout.tsx',
  'src/components/layout/dashboard-shell.tsx',
  'src/components/shared/locale-switcher.tsx',
  'src/components/shared/theme-toggle.tsx',
  'src/components/providers/theme-provider.tsx',
  'src/i18n/routing.ts',
  'messages/fa.json',
  'messages/en.json',
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`فایل موردنیاز پیدا نشد: ${file}`);
    console.error('این اسکریپت را از ریشه پروژه payeh-frontend اجرا کن.');
    process.exit(1);
  }
}

function write(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.replace(/^\n/, ''), 'utf8');
  // console.log(`Updated: ${relativePath}`);
}

function addMessages(file, values) {
  const fullPath = path.join(root, file);
  const json = JSON.parse(fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, ''));
  json.common ??= {};
  Object.assign(json.common, values);
  fs.writeFileSync(fullPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  // console.log(`Updated: ${file}`);
}

write('src/i18n/routing.ts', `
import { defineRouting } from "next-intl/routing";

/**
 * برای افزودن زبان جدید، فقط یک گزینه به این فهرست اضافه کن،
 * فایل ترجمه آن زبان را در messages بساز و جهت نوشتار را مشخص کن.
 */
export const localeOptions = [
  { code: "fa", label: "فارسی", direction: "rtl" },
  { code: "en", label: "English", direction: "ltr" },
] as const;

export type AppLocale = (typeof localeOptions)[number]["code"];

export const routing = defineRouting({
  locales: localeOptions.map((locale) => locale.code),
  defaultLocale: "fa",
});

export const localeDirections: Record<string, "rtl" | "ltr"> =
  Object.fromEntries(
    localeOptions.map(({ code, direction }) => [code, direction]),
  );

export const localeNames: Record<string, string> = Object.fromEntries(
  localeOptions.map(({ code, label }) => [code, label]),
);
`);

write('src/components/shared/locale-switcher.tsx', `
"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={isPending}
          aria-label={t("switchLanguage")}
        >
          <Languages className="size-4" aria-hidden />
          <span>{localeNames[locale] ?? locale}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => {
            if (!routing.locales.includes(value as (typeof routing.locales)[number])) {
              return;
            }

            startTransition(() =>
              router.replace(pathname, {
                locale: value as (typeof routing.locales)[number],
              }),
            );
          }}
        >
          {routing.locales.map((localeCode) => (
            <DropdownMenuRadioItem key={localeCode} value={localeCode}>
              {localeNames[localeCode] ?? localeCode}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
`);

write('src/components/shared/theme-toggle.tsx', `
"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeChoice = "light" | "dark" | "system";

const THEME_OPTIONS = [
  { value: "light", icon: Sun, label: "themeLight" },
  { value: "dark", icon: Moon, label: "themeDark" },
  { value: "system", icon: Monitor, label: "themeSystem" },
] as const;

export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label={t("toggleTheme")}
          title={t("toggleTheme")}
        >
          <Sun className="size-4 dark:hidden" aria-hidden />
          <Moon className="hidden size-4 dark:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={(value) => setTheme(value as ThemeChoice)}
        >
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
`);

write('src/lib/palette.ts', `
"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ColorPalette = "default" | "indigo";

const STORAGE_KEY = "payeh-color-palette";
const listeners = new Set<() => void>();

function readPalette(): ColorPalette {
  try {
    return localStorage.getItem(STORAGE_KEY) === "indigo" ? "indigo" : "default";
  } catch {
    return "default";
  }
}

function applyPalette(palette: ColorPalette) {
  const root = document.documentElement;

  if (palette === "default") {
    delete root.dataset.palette;
  } else {
    root.dataset.palette = palette;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  applyPalette(readPalette());

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      const palette = readPalette();
      applyPalette(palette);
      onChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): ColorPalette {
  return readPalette();
}

function getServerSnapshot(): ColorPalette {
  return "default";
}

export function usePalette() {
  const palette = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setPalette = useCallback((next: ColorPalette) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // اگر localStorage در دسترس نباشد، پالت برای همین صفحه اعمال می‌شود.
    }

    applyPalette(next);
    listeners.forEach((listener) => listener());
  }, []);

  return { palette, setPalette };
}
`);

write('src/components/providers/palette-initializer.tsx', `
"use client";

import { useEffect } from "react";
import { usePalette } from "@/lib/palette";

export function PaletteInitializer() {
  const { palette } = usePalette();

  useEffect(() => {
    const root = document.documentElement;

    if (palette === "default") {
      delete root.dataset.palette;
    } else {
      root.dataset.palette = palette;
    }
  }, [palette]);

  return null;
}
`);

write('src/components/providers/theme-sync.tsx', `
"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

/**
 * در جابه‌جایی locale ممکن است عنصر html دوباره رندر شود.
 * تم ذخیره‌شده را پس از تغییر زبان دوباره روی ریشه اعمال می‌کنیم.
 */
export function ThemeSync() {
  const locale = useLocale();

  useEffect(() => {
    let storedTheme = "system";

    try {
      storedTheme = localStorage.getItem("theme") ?? "system";
    } catch {
      // در صورت عدم دسترسی به localStorage از تنظیم سیستم استفاده می‌شود.
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark =
      storedTheme === "dark" ||
      (storedTheme !== "light" && prefersDark);

    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [locale]);

  return null;
}
`);

write('src/components/shared/palette-switcher.tsx', `
"use client";

import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePalette, type ColorPalette } from "@/lib/palette";

const PALETTE_OPTIONS = [
  { value: "default", label: "paletteDefault", swatch: "#18181b" },
  { value: "indigo", label: "paletteIndigo", swatch: "#4f46e5" },
] as const;

export function PaletteSwitcher() {
  const t = useTranslations("common");
  const { palette, setPalette } = usePalette();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label={t("palette")}
          title={t("palette")}
        >
          <Palette className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={palette}
          onValueChange={(value) => setPalette(value as ColorPalette)}
        >
          {PALETTE_OPTIONS.map(({ value, label, swatch }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <span
                className="size-3 rounded-full border border-foreground/15"
                style={{ backgroundColor: swatch }}
                aria-hidden
              />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
`);

const dashboardPath = path.join(root, 'src/components/layout/dashboard-shell.tsx');
let dashboard = fs.readFileSync(dashboardPath, 'utf8');
if (!dashboard.includes('PaletteSwitcher')) {
  dashboard = dashboard.replace(
    'import { LocaleSwitcher } from "@/components/shared/locale-switcher";\n',
    'import { LocaleSwitcher } from "@/components/shared/locale-switcher";\nimport { PaletteSwitcher } from "@/components/shared/palette-switcher";\n',
  );
  dashboard = dashboard.replace(
    '<LocaleSwitcher />\n          <ThemeToggle />',
    '<LocaleSwitcher />\n          <PaletteSwitcher />\n          <ThemeToggle />',
  );
  fs.writeFileSync(dashboardPath, dashboard, 'utf8');
  // console.log('Updated: src/components/layout/dashboard-shell.tsx');
} else {
  // console.log('Skipped: dashboard-shell already contains PaletteSwitcher');
}

const layoutPath = path.join(root, 'src/app/[locale]/layout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');
if (!layout.includes('ThemeSync')) {
  layout = layout.replace(
    'import { ThemeProvider } from "@/components/providers/theme-provider";\n',
    'import { ThemeProvider } from "@/components/providers/theme-provider";\nimport { PaletteInitializer } from "@/components/providers/palette-initializer";\nimport { ThemeSync } from "@/components/providers/theme-sync";\n',
  );
  layout = layout.replace(
    '<TooltipProvider>{children}</TooltipProvider>',
    '<ThemeSync />\n            <PaletteInitializer />\n            <TooltipProvider>{children}</TooltipProvider>',
  );
  fs.writeFileSync(layoutPath, layout, 'utf8');
  // console.log('Updated: src/app/[locale]/layout.tsx');
} else {
  // console.log('Skipped: locale layout already contains ThemeSync');
}

const cssPath = path.join(root, 'src/app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8').replace(/^\uFEFF/, '');
const cssMarker = '/* Payeh selectable Indigo palette */';
if (!css.includes(cssMarker)) {
  css += `\n\n${cssMarker}
@theme inline {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}

/* توکن‌های وضعیت برای پالت فعلی؛ رنگ‌های اصلی فعلی تغییر نمی‌کنند. */
:root {
  --success: #15803d;
  --success-foreground: #ffffff;
  --warning: #b45309;
  --warning-foreground: #ffffff;
  --info: #0369a1;
  --info-foreground: #ffffff;
}

.dark {
  --success: #5fc293;
  --success-foreground: #07170f;
  --warning: #e2aa55;
  --warning-foreground: #1d1204;
  --info: #67b4e8;
  --info-foreground: #07131d;
}

/* Indigo - Light */
:root[data-palette="indigo"] {
  color-scheme: light;
  --background: #f5f6fa;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --primary: #4f46e5;
  --primary-foreground: #ffffff;
  --secondary: #eceef6;
  --secondary-foreground: #1e293b;
  --accent: #e9ebfa;
  --accent-foreground: #312e81;
  --muted: #eff1f7;
  --muted-foreground: #556075;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --success: #15803d;
  --success-foreground: #ffffff;
  --warning: #b45309;
  --warning-foreground: #ffffff;
  --info: #0369a1;
  --info-foreground: #ffffff;
  --border: #e1e4ee;
  --input: #c3c9da;
  --ring: #4f46e5;
  --selected: #e4e7fa;
  --selected-foreground: #312e81;
  --overlay: rgb(15 23 42 / 0.5);
  --shadow-color: rgb(15 23 42 / 0.07);
}

/* Indigo - Dark */
.dark[data-palette="indigo"] {
  color-scheme: dark;
  --background: #131722;
  --foreground: #e5e8f0;
  --card: #1a1f2d;
  --card-foreground: #e5e8f0;
  --popover: #212737;
  --popover-foreground: #e5e8f0;
  --primary: #8f97ee;
  --primary-foreground: #11142b;
  --secondary: #262c3d;
  --secondary-foreground: #e5e8f0;
  --accent: #2a3147;
  --accent-foreground: #e5e8f0;
  --muted: #1f2536;
  --muted-foreground: #9ba4ba;
  --destructive: #ef7b7b;
  --destructive-foreground: #1c0b0b;
  --success: #5fc293;
  --success-foreground: #07170f;
  --warning: #e2aa55;
  --warning-foreground: #1d1204;
  --info: #67b4e8;
  --info-foreground: #07131d;
  --border: #2c3347;
  --input: #3b4359;
  --ring: #8f97ee;
  --selected: #2a3147;
  --selected-foreground: #e5e8f0;
  --overlay: rgb(5 8 16 / 0.65);
  --shadow-color: rgb(0 0 0 / 0.35);
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  // console.log('Updated: src/app/globals.css');
} else {
  // console.log('Skipped: Indigo palette already exists in globals.css');
}

addMessages('messages/fa.json', {
  language: 'زبان',
  themeLight: 'روشن',
  themeDark: 'تاریک',
  themeSystem: 'مطابق سیستم',
  palette: 'پالت رنگی',
  paletteDefault: 'پالت فعلی',
  paletteIndigo: 'ایندیگو',
});

addMessages('messages/en.json', {
  language: 'Language',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',
  palette: 'Color palette',
  paletteDefault: 'Current palette',
  paletteIndigo: 'Indigo',
});

// console.log('\nانجام شد. حالا npm run typecheck و npm run lint را اجرا کن.');
