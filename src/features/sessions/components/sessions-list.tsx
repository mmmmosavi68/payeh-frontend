"use client";

import { LogOut, Monitor, Smartphone, Tablet } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRemoteData } from "@/hooks/use-remote-data";
import { listSessions, revokeOtherSessions, revokeSession } from "@/features/sessions/api";
import type { SessionRecord } from "@/types/session";

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
} as const;

export function SessionsList() {
  const t = useTranslations("sessions");
  const format = useFormatter();
  const { data, failed, reload } = useRemoteData("sessions", listSessions);
  const [now] = useState(() => new Date());

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [target, setTarget] = useState<SessionRecord | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);

  const hasOthers = data?.some((session) => !session.current) ?? false;

  async function confirmRevoke() {
    if (!target) return;
    await revokeSession(target.id);
    toast.success(t("toast.revoked"));
    reload();
  }

  async function confirmRevokeOthers() {
    await revokeOtherSessions();
    toast.success(t("toast.revokedOthers"));
    reload();
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="rounded-full"
          disabled={!hasOthers}
          onClick={() => setOthersOpen(true)}
        >
          <LogOut className="size-4" aria-hidden />
          {t("revokeOthers")}
        </Button>
      </div>

      {failed ? (
        <ErrorState
          title={t("error.title")}
          description={t("error.description")}
          onRetry={reload}
        />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={<Monitor className="size-5" aria-hidden />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {!data
            ? Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="rounded-2xl border bg-card p-5">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="mt-4 h-4 w-32" />
                  <Skeleton className="mt-2 h-4 w-52" />
                </li>
              ))
            : data.map((session) => {
                const Icon = deviceIcons[session.deviceType];
                return (
                  <li
                    key={session.id}
                    className="flex items-start gap-4 rounded-2xl border bg-card p-5"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full border bg-secondary text-muted-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium" dir="ltr">
                          {session.device}
                        </p>
                        {session.current ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {t("current")}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("ip")}: <span dir="ltr">{session.ip}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("lastActive", {
                          time: format.relativeTime(
                            new Date(session.lastActiveAt),
                            now,
                          ),
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("signedInAt", {
                          date: format.dateTime(new Date(session.createdAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                        })}
                      </p>
                      {session.refreshTokenExpireAt ? <p className="text-xs text-muted-foreground">{t("expiresAt", { date: format.dateTime(new Date(session.refreshTokenExpireAt), { dateStyle: "medium", timeStyle: "short" }) })}</p> : null}
                    </div>

                    {!session.current ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-full"
                        onClick={() => {
                          setTarget(session);
                          setRevokeOpen(true);
                        }}
                      >
                        {t("revoke")}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
        </ul>
      )}

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title={t("revokeDialog.title")}
        description={t("revokeDialog.description", {
          device: target?.device ?? "",
        })}
        confirmLabel={t("revokeDialog.confirm")}
        onConfirm={confirmRevoke}
      />

      <ConfirmDialog
        open={othersOpen}
        onOpenChange={setOthersOpen}
        title={t("revokeOthersDialog.title")}
        description={t("revokeOthersDialog.description")}
        confirmLabel={t("revokeOthersDialog.confirm")}
        onConfirm={confirmRevokeOthers}
      />
    </div>
  );
}