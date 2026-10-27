import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  crumbs?: Crumb[];
};

export function PageHeader({
  title,
  description,
  crumbs = [],
}: PageHeaderProps) {
  const t = useTranslations("common");

  return (
    <header className="px-1 py-4 sm:py-6">
      <nav aria-label={t("breadcrumb")} className="mb-4">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <li>
            <Link
              href="/dashboard"
              className="flex items-center transition-colors hover:text-foreground"
            >
              <Home className="size-4" aria-hidden />
              <span className="sr-only">{t("home")}</span>
            </Link>
          </li>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={crumb.label} className="flex items-center gap-2">
                <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "font-medium text-foreground" : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  );
}