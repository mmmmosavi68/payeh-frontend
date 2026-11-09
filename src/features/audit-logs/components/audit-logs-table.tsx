"use client";

import { Download, Search } from "lucide-react";
import { useFormatter, useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRemoteData } from "@/hooks/use-remote-data";
import { searchAuditLogs, type AuditQuery } from "../api";
import { usePermission } from "@/features/permissions/use-permission";

function csvCell(value: unknown) { const text = String(value ?? ""); return `"${text.replaceAll('"', '""')}"`; }
function exportCsv(rows: Array<Record<string, unknown>>, locale: string) {
  const headers = ["occurredAtUtc", "eventType", "action", "userName", "ipAddress", "statusCode", "path", "description"];
  const content = [headers.map(csvCell).join(","), ...rows.map(row => headers.map(key => csvCell(row[key])).join(","))].join("\r\n");
  const blob = new Blob(["﻿", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  toast.success(locale === "fa" ? "فایل سازگار با Excel ساخته شد." : "Excel-compatible CSV exported.");
}

export function AuditLogsTable() {
  const locale = useLocale(); const format = useFormatter(); const fa = locale === "fa";
  const exportPermission = usePermission("AuditLogs", "Export");
  const [search, setSearch] = useState(""); const [eventType, setEventType] = useState("all"); const [userName, setUserName] = useState(""); const [userId, setUserId] = useState(""); const [ipAddress, setIpAddress] = useState(""); const [entityId, setEntityId] = useState(""); const [action, setAction] = useState(""); const [entityName, setEntityName] = useState(""); const [statusCode, setStatusCode] = useState(""); const [fromUtc, setFromUtc] = useState(""); const [toUtc, setToUtc] = useState(""); const [page, setPage] = useState(1);
  const query = useMemo<AuditQuery>(() => ({ pageNumber: page, pageSize: 20, search: search.trim() || undefined, eventType: eventType === "all" ? undefined : eventType, userName: userName.trim() || undefined, userId: userId.trim() || undefined, ipAddress: ipAddress.trim() || undefined, entityId: entityId.trim() || undefined, action: action.trim() || undefined, entityName: entityName.trim() || undefined, statusCode: statusCode ? Number(statusCode) : undefined, fromUtc: fromUtc ? new Date(`${fromUtc}T00:00:00Z`).toISOString() : undefined, toUtc: toUtc ? new Date(`${toUtc}T23:59:59Z`).toISOString() : undefined }), [page, search, eventType, userName, userId, ipAddress, entityId, action, entityName, statusCode, fromUtc, toUtc]);
  const { data, loading, failed, reload } = useRemoteData(JSON.stringify(query), () => searchAuditLogs(query));
  const rows = data?.items ?? [];
  const label = (faText: string, enText: string) => fa ? faText : enText;
  return <section className="space-y-4">
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="ps-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={label("جستجو در رویدادها، کاربر و مسیر...", "Search events, users and paths...")}/></div>
      <Select value={eventType} onValueChange={value => { setEventType(value); setPage(1); }}><SelectTrigger className="sm:w-48"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{label("همه رویدادها", "All events")}</SelectItem><SelectItem value="Activity">Activity</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="Request">Request</SelectItem></SelectContent></Select>
      {exportPermission.allowed ? <Button variant="outline" onClick={() => exportCsv(rows as unknown as Array<Record<string, unknown>>, locale)} disabled={!rows.length}><Download className="size-4"/>{label("خروجی Excel صفحه", "Export page to Excel")}</Button> : null}
    </div>
    <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input value={userName} onChange={e=>{setUserName(e.target.value);setPage(1);}} placeholder={label("نام کاربری", "Username")}/>
      <Input value={userId} onChange={e=>{setUserId(e.target.value);setPage(1);}} placeholder="User ID" dir="ltr"/>
      <Input value={ipAddress} onChange={e=>{setIpAddress(e.target.value);setPage(1);}} placeholder="IP address" dir="ltr"/>
      <Input value={action} onChange={e=>{setAction(e.target.value);setPage(1);}} placeholder={label("نام عملیات", "Action")}/>
      <Input value={entityName} onChange={e=>{setEntityName(e.target.value);setPage(1);}} placeholder={label("نام موجودیت", "Entity name")}/>
      <Input value={entityId} onChange={e=>{setEntityId(e.target.value);setPage(1);}} placeholder="Entity ID" dir="ltr"/>
      <Input type="number" value={statusCode} onChange={e=>{setStatusCode(e.target.value);setPage(1);}} placeholder={label("کد وضعیت HTTP", "HTTP status")}/>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">{label("از تاریخ UTC", "From UTC")}<Input type="date" value={fromUtc} onChange={e=>{setFromUtc(e.target.value);setPage(1);}}/></label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">{label("تا تاریخ UTC", "To UTC")}<Input type="date" value={toUtc} onChange={e=>{setToUtc(e.target.value);setPage(1);}}/></label>
    </div>
    {failed ? <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-6 text-sm"><p>{label("دریافت سوابق ممیزی ناموفق بود یا مجوز مشاهده ندارید.", "Could not load audit logs or you do not have permission.")}</p><Button className="mt-3" variant="outline" onClick={reload}>{label("تلاش مجدد", "Retry")}</Button></div> : <div className="overflow-x-auto rounded-2xl border bg-card"><Table><TableHeader><TableRow><TableHead>{label("زمان (UTC)", "Time (UTC)")}</TableHead><TableHead>{label("نوع", "Type")}</TableHead><TableHead>{label("عملیات", "Action")}</TableHead><TableHead>{label("کاربر", "User")}</TableHead><TableHead>{label("IP", "IP")}</TableHead><TableHead>{label("وضعیت", "Status")}</TableHead><TableHead>{label("مسیر", "Path")}</TableHead></TableRow></TableHeader><TableBody>{loading && !data ? Array.from({length:5},(_,i)=><TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-5 w-full"/></TableCell></TableRow>) : rows.length ? rows.map(row=><TableRow key={row.id}><TableCell className="whitespace-nowrap">{format.dateTime(new Date(row.occurredAtUtc),{dateStyle:"short",timeStyle:"medium"})}</TableCell><TableCell>{row.eventType}</TableCell><TableCell className="max-w-56 truncate">{row.action}</TableCell><TableCell>{row.userName ?? "—"}</TableCell><TableCell dir="ltr">{row.ipAddress ?? "—"}</TableCell><TableCell>{row.statusCode ?? "—"}</TableCell><TableCell className="max-w-64 truncate" dir="ltr">{row.path ?? "—"}</TableCell></TableRow>) : <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">{label("رکوردی پیدا نشد.", "No records found.")}</TableCell></TableRow>}</TableBody></Table></div>}
    <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label("تعداد کل", "Total")}: {data?.totalCount ?? 0}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(v => v - 1)}>{label("قبلی", "Previous")}</Button><span>{page} / {Math.max(data?.totalPages ?? 0, 1)}</span><Button variant="outline" size="sm" disabled={!data || page >= data.totalPages || loading} onClick={() => setPage(v => v + 1)}>{label("بعدی", "Next")}</Button></div></div>
  </section>;
}
