"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Source = "database" | "environment" | "none";

interface FieldStatus {
  configured: boolean;
  source: Source;
  value: string | null;
}

interface StripeSettingsDto {
  configured: boolean;
  mode: "test" | "live" | null;
  modeMismatch: boolean;
  secretKey: FieldStatus;
  publishableKey: FieldStatus;
  webhookSecret: FieldStatus;
}

type FieldName = "secretKey" | "publishableKey" | "webhookSecret";

const FIELDS: { name: FieldName; label: string; placeholder: string; secret: boolean; help: string }[] = [
  {
    name: "secretKey",
    label: "Secret key",
    placeholder: "sk_live_…",
    secret: true,
    help: "Server-side key used to create payments and payouts. Never shared with the browser.",
  },
  {
    name: "publishableKey",
    label: "Publishable key",
    placeholder: "pk_live_…",
    secret: false,
    help: "Public key the checkout uses to show the card form.",
  },
  {
    name: "webhookSecret",
    label: "Webhook signing secret",
    placeholder: "whsec_…",
    secret: true,
    help: "Verifies that payment events really come from Stripe.",
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function SourceNote({ status }: { status: FieldStatus }) {
  if (status.source === "database") return <>Saved in the admin panel</>;
  if (status.source === "environment") return <>Using the server&apos;s .env value</>;
  return <>Not set</>;
}

export function StripeSettings() {
  const [data, setData] = useState<StripeSettingsDto | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<FieldName, string>>>({});
  const [revealed, setRevealed] = useState<Partial<Record<FieldName, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<FieldName | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(() => {
    api
      .get<StripeSettingsDto>("/stripe/settings")
      .then(setData)
      .catch(() => toast.error("Failed to load Stripe settings"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = (Object.keys(drafts) as FieldName[]).filter((k) => drafts[k]?.trim());

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const body = Object.fromEntries(dirty.map((k) => [k, drafts[k]!.trim()]));
      setData(await api.put<StripeSettingsDto>("/stripe/settings", body));
      setDrafts({});
      toast.success("Stripe settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save Stripe settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (name: FieldName) => {
    setRemoving(name);
    setTestResult(null);
    try {
      setData(await api.put<StripeSettingsDto>("/stripe/settings", { [name]: "" }));
      setDrafts((d) => ({ ...d, [name]: undefined }));
      toast.success("Saved value removed");
    } catch {
      toast.error("Could not remove the saved value");
    } finally {
      setRemoving(null);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await api.post<{ ok: boolean; message: string }>("/stripe/settings/test"));
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : "Connection test failed" });
    } finally {
      setTesting(false);
    }
  };

  const webhookUrl = `${API_BASE.replace(/\/$/, "")}/stripe/webhook`;

  if (!data) {
    return (
      <Card className="border border-border/50">
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">Stripe Payments</CardTitle>
          {data.configured ? (
            <Badge variant="outline" className="gap-1 text-success">
              <CheckCircle2 className="size-3" /> Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <XCircle className="size-3" /> Not configured
            </Badge>
          )}
          {data.mode === "live" && <Badge className="uppercase">Live</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Keys saved here are encrypted and override the server&apos;s .env values. Leave a field empty to keep
          its current value.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 p-4">
        {data.mode === "test" && (
          <p
            role="note"
            className="flex items-start gap-2 rounded border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span>
              These are test keys, so no real payments can be taken. Replace them with your live keys (
              <code>sk_live_</code> / <code>pk_live_</code>) to accept real payments.
            </span>
          </p>
        )}
        {data.modeMismatch && (
          <p role="alert" className="flex items-start gap-2 rounded border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            The secret and publishable keys are from different modes (test vs live). Payments will fail until they
            match.
          </p>
        )}

        {FIELDS.map((field) => {
          const status = data[field.name];
          const shown = revealed[field.name] || !field.secret;
          return (
            <div key={field.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`stripe-${field.name}`} className="text-sm font-medium text-foreground">
                  {field.label}
                </Label>
                <span className="text-xs text-muted-foreground">
                  <SourceNote status={status} />
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`stripe-${field.name}`}
                    type={shown ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    value={drafts[field.name] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [field.name]: e.target.value }))}
                    placeholder={status.value ?? field.placeholder}
                    className="h-9 pr-9 font-mono text-xs"
                  />
                  {field.secret && (
                    <button
                      type="button"
                      aria-label={shown ? "Hide value" : "Show value"}
                      onClick={() => setRevealed((r) => ({ ...r, [field.name]: !r[field.name] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  )}
                </div>
                {status.source === "database" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    disabled={removing !== null}
                    onClick={() => handleRemove(field.name)}
                  >
                    {removing === field.name ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{field.help}</p>
            </div>
          );
        })}

        <div className="space-y-1.5">
          <Label htmlFor="stripe-webhook-url" className="text-sm font-medium text-foreground">
            Webhook endpoint
          </Label>
          <div className="flex gap-2">
            <Input id="stripe-webhook-url" readOnly value={webhookUrl} className="h-9 font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              className="h-9"
              aria-label="Copy webhook URL"
              onClick={() => navigator.clipboard.writeText(webhookUrl).then(() => toast.success("Copied"))}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add this URL in the Stripe dashboard (Developers → Webhooks) and subscribe to{" "}
            <code>payment_intent.succeeded</code>, <code>payment_intent.payment_failed</code>,{" "}
            <code>account.updated</code> and <code>charge.dispute.created</code>.
          </p>
        </div>

        {testResult && (
          <p
            role="status"
            className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${
              testResult.ok ? "border-success/30 bg-success/5 text-success" : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {testResult.ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" /> : <XCircle className="mt-0.5 size-3.5 shrink-0" />}
            {testResult.message}
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button onClick={handleSave} disabled={saving || dirty.length === 0} className="h-9">
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save changes
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || !data.secretKey.configured} className="h-9">
            {testing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Test connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
