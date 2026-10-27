import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Brand } from "@/components/layout/brand";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("common");
  const tf = await getTranslations("footer");
  const format = await getFormatter();
  const year = format.number(new Date().getFullYear(), { useGrouping: false });

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--foreground) 7%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 7%, transparent) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, var(--background) 75%)",
          }}
        />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 flex justify-center">
        <div className="flex w-full max-w-[1400px] items-center justify-between rounded-b-xl border-x border-b bg-card/80 px-4 py-2 backdrop-blur-md md:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-10 pt-24">
        {children}
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground">
        {tf("rights", { year, name: t("appName") })}
      </footer>
    </div>
  );
}