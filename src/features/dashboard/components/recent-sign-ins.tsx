import { getFormatter, getTranslations } from "next-intl/server";
import { mockSignIns } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

export async function RecentSignIns() {
  const t = await getTranslations("dashboard.recent");
  const format = await getFormatter();
  const now = new Date();

  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <ul className="mt-4 divide-y">
        {mockSignIns.map((item) => {
          const when = new Date(now.getTime() - item.minutesAgo * 60_000);
          const success = item.status === "success";

          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" dir="ltr">
                  {item.user}
                </p>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {item.device}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    success
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {success ? t("success") : t("failed")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format.relativeTime(when, now)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}