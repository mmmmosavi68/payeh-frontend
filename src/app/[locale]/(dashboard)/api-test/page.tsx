"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTest, postTest, type TestRequest } from "@/features/home/api";

export default function ApiTestPage() {
  const locale = useLocale();
  const fa = locale === "fa";
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<TestRequest>({
    id: 1,
    name: "Test User",
    email: "test@example.com",
  });

  async function runGet() {
    setBusy(true);
    try {
      setResult(await getTest());
    } catch {
      toast.error(fa ? "درخواست GET ناموفق بود." : "GET request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runPost() {
    setBusy(true);
    try {
      setResult(await postTest(form));
    } catch {
      toast.error(fa ? "درخواست POST ناموفق بود." : "POST request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={fa ? "آزمایش API" : "API diagnostics"}
        description={fa ? "کنترلر Home — عملیات GET و POST" : "HomeController — GET and POST Test actions"}
        crumbs={[{ label: fa ? "آزمایش API" : "API diagnostics" }]}
      />
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={runGet}>{fa ? "اجرای GET" : "GET Test"}</Button>
        <Button variant="outline" disabled={busy} onClick={runPost}>{fa ? "اجرای POST" : "POST Test"}</Button>
      </div>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
        <Input type="number" value={form.id} onChange={event => setForm(value => ({ ...value, id: Number(event.target.value) }))} aria-label="Id" />
        <Input value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} aria-label="Name" />
        <Input value={form.email} onChange={event => setForm(value => ({ ...value, email: event.target.value }))} aria-label="Email" />
      </div>
      <pre className="overflow-auto rounded-2xl border bg-card p-4 text-xs" dir="ltr">
        {result ? JSON.stringify(result, null, 2) : (fa ? "هنوز پاسخی دریافت نشده است" : "No response yet")}
      </pre>
    </div>
  );
}
