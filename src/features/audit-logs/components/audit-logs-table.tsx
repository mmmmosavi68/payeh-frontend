"use client";

import { Copy, Download, Eye, Search } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useRemoteData } from "@/hooks/use-remote-data";
import { searchAuditLogs, type AuditQuery } from "../api";
import { usePermission } from "@/features/permissions/use-permission";

// --------------------------------------------------
// Types
// --------------------------------------------------

interface AuditLogRow {
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

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv(
  rows: Array<Record<string, unknown>>,
  successMessage: string
) {
  const headers = [
    "occurredAtUtc",
    "eventType",
    "action",
    "userName",
    "ipAddress",
    "statusCode",
    "path",
    "description",
  ];

  const content = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      headers.map((key) => csvCell(row[key])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `audit-logs-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);

  toast.success(successMessage);
}

function formatJson(value?: string | null) {
  if (!value) return null;

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

// --------------------------------------------------
// Detail item
// --------------------------------------------------

function DetailItem({
  label,
  value,
  dir,
}: {
  label: string;
  value?: string | number | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/30 p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>

      <p
        dir={dir}
        className="break-words text-sm font-medium"
      >
        {value !== null && value !== undefined && value !== ""
          ? value
          : "—"}
      </p>
    </div>
  );
}

// --------------------------------------------------
// JSON detail
// --------------------------------------------------

function JsonDetail({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  const t = useTranslations("auditLogs");
  const formatted = formatJson(value);

  async function copyJson() {
    if (!formatted) return;

    try {
      await navigator.clipboard.writeText(formatted);
      toast.success(t("copySuccess"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>

        {formatted && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copyJson}
          >
            <Copy className="me-1 size-3.5" />
            {t("copy")}
          </Button>
        )}
      </div>

      {formatted ? (
        <pre
          dir="ltr"
          className="max-h-72 overflow-auto rounded-lg border bg-muted/40 p-4 text-left text-xs leading-6"
        >
          {formatted}
        </pre>
      ) : (
        <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          {t("details.noData")}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// Audit log details dialog
// --------------------------------------------------

function AuditLogDetails({ log }: { log: AuditLogRow }) {
  const [open, setOpen] = useState(false);

  const t = useTranslations("auditLogs");
  const locale = useLocale();
  const fa = locale === "fa";

  const dateText = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(log.occurredAtUtc));

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Eye className="me-1 size-4" />
        {t("detailsButton")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          dir={fa ? "rtl" : "ltr"}
          className="!w-[96vw] !max-w-[1400px] max-h-[92vh] overflow-y-auto"
        >
          <DialogHeader className={fa ? "text-right" : "text-left"}>
            <DialogTitle>{t("details.title")}</DialogTitle>

            <DialogDescription dir="auto">
              {log.eventType} / {log.action}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* General information */}

            <section className="space-y-3">
              <h3 className="text-sm font-bold">
                {t("details.generalInfo")}
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label={t("details.eventType")}
                  value={log.eventType}
                />

                <DetailItem
                  label={t("details.action")}
                  value={log.action}
                />

                <DetailItem
                  label={t("details.user")}
                  value={log.userName}
                />

                <DetailItem
                  label={t("details.userId")}
                  value={log.userId}
                  dir="ltr"
                />

                <DetailItem
                  label={t("details.time")}
                  value={dateText}
                />

                <DetailItem
                  label={t("details.ipAddress")}
                  value={log.ipAddress}
                  dir="ltr"
                />

                <DetailItem
                  label={t("details.entity")}
                  value={log.entityName}
                />

                <DetailItem
                  label={t("details.entityId")}
                  value={log.entityId}
                  dir="ltr"
                />

                <DetailItem
                  label={t("details.description")}
                  value={log.description}
                />
              </div>
            </section>

            {/* HTTP information */}

            <section className="space-y-3">
              <h3 className="text-sm font-bold">
                {t("details.httpInfo")}
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label={t("details.httpMethod")}
                  value={log.httpMethod}
                  dir="ltr"
                />

                <DetailItem
                  label={t("details.path")}
                  value={log.path}
                  dir="ltr"
                />

                <DetailItem
                  label={t("details.statusCode")}
                  value={log.statusCode}
                />

                <DetailItem
                  label={t("details.duration")}
                  value={log.durationMs}
                />

                <DetailItem
                  label={t("details.correlationId")}
                  value={log.correlationId}
                  dir="ltr"
                />
              </div>

              {log.userAgent && (
                <DetailItem
                  label={t("details.userAgent")}
                  value={log.userAgent}
                  dir="ltr"
                />
              )}
            </section>

            {/* Old and new values */}

            <section className="space-y-3">
              <h3 className="text-sm font-bold">
                {t("details.changes")}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <JsonDetail
                  title={t("details.oldValues")}
                  value={log.oldValuesJson}
                />

                <JsonDetail
                  title={t("details.newValues")}
                  value={log.newValuesJson}
                />
              </div>
            </section>

            {/* Log ID */}

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                {t("details.logId")}
              </p>

              <p dir="ltr" className="break-all text-xs">
                {log.id}
              </p>
            </div>
          </div>

          {/* Footer */}

          <div className="flex justify-end border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("details.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --------------------------------------------------
// Main table
// --------------------------------------------------

export function AuditLogsTable() {
  const locale = useLocale();
  const format = useFormatter();
  const t = useTranslations("auditLogs");

  const fa = locale === "fa";

  const exportPermission = usePermission("AuditLogs", "Export");

  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("all");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState("");
  const [entityName, setEntityName] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [fromUtc, setFromUtc] = useState("");
  const [toUtc, setToUtc] = useState("");
  const [page, setPage] = useState(1);

  const query = useMemo<AuditQuery>(
    () => ({
      pageNumber: page,
      pageSize: 20,

      search: search.trim() || undefined,

      eventType: eventType === "all" ? undefined : eventType,

      userName: userName.trim() || undefined,
      userId: userId.trim() || undefined,
      ipAddress: ipAddress.trim() || undefined,
      entityId: entityId.trim() || undefined,
      action: action.trim() || undefined,
      entityName: entityName.trim() || undefined,

      statusCode: statusCode ? Number(statusCode) : undefined,

      fromUtc: fromUtc
        ? new Date(`${fromUtc}T00:00:00Z`).toISOString()
        : undefined,

      toUtc: toUtc
        ? new Date(`${toUtc}T23:59:59Z`).toISOString()
        : undefined,
    }),
    [
      page,
      search,
      eventType,
      userName,
      userId,
      ipAddress,
      entityId,
      action,
      entityName,
      statusCode,
      fromUtc,
      toUtc,
    ]
  );

  const { data, loading, failed, reload } = useRemoteData(
    JSON.stringify(query),
    () => searchAuditLogs(query)
  );

  const rows = data?.items ?? [];

  function translateEventType(value: string) {
    switch (value) {
      case "Activity":
        return t("eventTypes.activity");
      case "Security":
        return t("eventTypes.security");
      case "Request":
        return t("eventTypes.request");
      default:
        return value;
    }
  }

  return (
    <section dir={fa ? "rtl" : "ltr"} className="space-y-4">
      {/* Search and export */}

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            className="ps-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
          />
        </div>

        <Select
          value={eventType}
          onValueChange={(value) => {
            setEventType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              {t("filters.allEvents")}
            </SelectItem>

            <SelectItem value="Activity">
              {t("eventTypes.activity")}
            </SelectItem>

            <SelectItem value="Security">
              {t("eventTypes.security")}
            </SelectItem>

            <SelectItem value="Request">
              {t("eventTypes.request")}
            </SelectItem>
          </SelectContent>
        </Select>

        {exportPermission.allowed && (
          <Button
            variant="outline"
            onClick={() =>
              exportCsv(
                rows as unknown as Array<Record<string, unknown>>,
                t("exportSuccess")
              )
            }
            disabled={!rows.length}
          >
            <Download className="size-4" />
            {t("export")}
          </Button>
        )}
      </div>

      {/* Filters */}

      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={userName}
          onChange={(e) => {
            setUserName(e.target.value);
            setPage(1);
          }}
          placeholder={t("filters.username")}
        />

        <Input
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          placeholder={t("filters.userId")}
          dir="ltr"
        />

        <Input
          value={ipAddress}
          onChange={(e) => {
            setIpAddress(e.target.value);
            setPage(1);
          }}
          placeholder={t("filters.ipAddress")}
          dir="ltr"
        />

        <Input
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          placeholder={t("filters.action")}
        />

        <Input
          value={entityName}
          onChange={(e) => {
            setEntityName(e.target.value);
            setPage(1);
          }}
          placeholder={t("filters.entityName")}
        />

        <Input
          value={entityId}
          onChange={(e) => {
            setEntityId(e.target.value);
            setPage(1);
          }}
          placeholder={t("filters.entityId")}
          dir="ltr"
        />

        <Input
          type="number"
          value={statusCode}
          onChange={(e) => {
            setStatusCode(e.target.value);
            setPage(1);
          }}
          placeholder={t("filters.statusCode")}
        />

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("filters.fromUtc")}

          <Input
            type="date"
            value={fromUtc}
            onChange={(e) => {
              setFromUtc(e.target.value);
              setPage(1);
            }}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("filters.toUtc")}

          <Input
            type="date"
            value={toUtc}
            onChange={(e) => {
              setToUtc(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {/* Table */}

      {failed ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-card p-6 text-sm"
        >
          <p>{t("loadFailed")}</p>

          <Button
            className="mt-3"
            variant="outline"
            onClick={reload}
          >
            {t("retry")}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.time")}</TableHead>
                <TableHead>{t("columns.type")}</TableHead>
                <TableHead>{t("columns.action")}</TableHead>
                <TableHead>{t("columns.user")}</TableHead>
                <TableHead>{t("columns.ip")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.path")}</TableHead>
                <TableHead className="text-center">
                  {t("columns.details")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && !data ? (
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {format.dateTime(new Date(row.occurredAtUtc), {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </TableCell>

                    <TableCell>
                      {translateEventType(row.eventType)}
                    </TableCell>

                    <TableCell className="max-w-56 truncate">
                      {row.action}
                    </TableCell>

                    <TableCell>{row.userName ?? "—"}</TableCell>

                    <TableCell dir="ltr">
                      {row.ipAddress ?? "—"}
                    </TableCell>

                    <TableCell>{row.statusCode ?? "—"}</TableCell>

                    <TableCell
                      className="max-w-64 truncate"
                      dir="ltr"
                    >
                      {row.path ?? "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <AuditLogDetails log={row as AuditLogRow} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t("noRecords")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t("total", { count: data?.totalCount ?? 0 })}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((v) => v - 1)}
          >
            {t("previous")}
          </Button>

          <span>
            {t("pagination.page", {
              page,
              pages: Math.max(data?.totalPages ?? 0, 1),
            })}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!data || page >= data.totalPages || loading}
            onClick={() => setPage((v) => v + 1)}
          >
            {t("next")}
          </Button>
        </div>
      </div>
    </section>
  );
}