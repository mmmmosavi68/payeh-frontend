
"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export interface AuditLogDetails {
  id: string;
  userId?: string | null;
  userName?: string | null;
  eventType: string;
  action: string;
  description?: string | null;
  entityName?: string | null;
  entityId?: string | null;
  httpMethod?: string | null;
  path?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  oldValuesJson?: string | null;
  newValuesJson?: string | null;
  occurredAtUtc: string;
}

interface Props {
  log: AuditLogDetails;
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return (
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "medium",
      timeZone: "UTC",
    }).format(date) + " UTC"
  );
}

function formatJson(value?: string | null) {
  if (!value) return null;

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function InfoItem({
  label,
  value,
  dir,
}: {
  label: string;
  value?: string | number | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </div>

      <div
        dir={dir}
        className="break-words text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {value === null || value === undefined || value === ""
          ? "—"
          : value}
      </div>
    </div>
  );
}

function JsonSection({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  const t = useTranslations("auditLogs");
  const formatted = formatJson(value);

  const copyValue = async () => {
    if (!formatted) return;

    try {
      await navigator.clipboard.writeText(formatted);
      // Copy feedback can be added here if needed.
    } catch {
      // Clipboard may be unavailable.
    }
  };

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>

        {formatted && (
          <button
            type="button"
            onClick={copyValue}
            className="rounded-md px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800"
          >
            {t("copy")}
          </button>
        )}
      </div>

      {formatted ? (
        <pre
          dir="ltr"
          className="max-h-72 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-xs leading-6 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          {formatted}
        </pre>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 dark:border-gray-700">
          {t("details.noData")}
        </div>
      )}
    </section>
  );
}

export default function AuditLogDetailsModal({ log }: Props) {
  const [open, setOpen] = useState(false);

  const t = useTranslations("auditLogs");
  const locale = useLocale();
  const isRtl = locale === "fa";

  const d = (key: string) => t(`details.${key}`);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>

        {t("detailsButton")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
            dir={isRtl ? "rtl" : "ltr"}
            className="flex max-h-[92vh] w-[96vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h2
                  id="audit-modal-title"
                  className="text-lg font-bold text-gray-900 dark:text-white"
                >
                  {d("title")}
                </h2>

                <p className="mt-1 text-xs text-gray-500" dir="auto">
                  {log.eventType} / {log.action}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-5">
              <section>
                <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                  {d("generalInfo")}
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label={d("eventType")} value={log.eventType} />
                  <InfoItem label={d("action")} value={log.action} />
                  <InfoItem label={d("user")} value={log.userName} />
                  <InfoItem label={d("userId")} value={log.userId} dir="ltr" />

                  <InfoItem
                    label={d("time")}
                    value={formatDate(log.occurredAtUtc, locale)}
                  />

                  <InfoItem
                    label={d("ipAddress")}
                    value={log.ipAddress}
                    dir="ltr"
                  />

                  <InfoItem label={d("entity")} value={log.entityName} />

                  <InfoItem
                    label={d("entityId")}
                    value={log.entityId}
                    dir="ltr"
                  />

                  <InfoItem
                    label={d("description")}
                    value={log.description}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                  {d("httpInfo")}
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem
                    label={d("httpMethod")}
                    value={log.httpMethod}
                    dir="ltr"
                  />

                  <InfoItem
                    label={d("path")}
                    value={log.path}
                    dir="ltr"
                  />

                  <InfoItem
                    label={d("statusCode")}
                    value={log.statusCode}
                  />

                  <InfoItem
                    label={d("duration")}
                    value={log.durationMs}
                  />

                  <InfoItem
                    label={d("correlationId")}
                    value={log.correlationId}
                    dir="ltr"
                  />
                </div>

                {log.userAgent && (
                  <div className="mt-3">
                    <InfoItem
                      label={d("userAgent")}
                      value={log.userAgent}
                      dir="ltr"
                    />
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                  {d("changes")}
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <JsonSection
                    title={d("oldValues")}
                    value={log.oldValuesJson}
                  />

                  <JsonSection
                    title={d("newValues")}
                    value={log.newValuesJson}
                  />
                </div>
              </section>

              <div className="break-all rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900">
                <span className="font-semibold">{d("logId")}: </span>
                <span dir="ltr">{log.id}</span>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex border-t border-gray-200 px-5 py-4 dark:border-gray-800 ${
                isRtl ? "justify-start" : "justify-end"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
