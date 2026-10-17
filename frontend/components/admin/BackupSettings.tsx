"use client";

import { useEffect, useState } from "react";
import { Clock, Database, Download, HardDriveDownload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LoadError } from "@/components/admin/LoadError";
import { api, downloadFile } from "@/lib/api";

interface BackupInfo {
  name: string;
  type: "manual" | "auto";
  size: number;
  createdAt: string;
  tables: number;
  rows: number;
}

interface ScheduleForm {
  enabled: boolean;
  frequency: "daily" | "weekly";
  hour: string;
  retention: string;
}

interface Overview {
  settings: { enabled: boolean; frequency: "daily" | "weekly"; hour: number; retention: number };
  backups: BackupInfo[];
  nextRunAt: string | null;
}

const toForm = (s: Overview["settings"]): ScheduleForm => ({
  enabled: s.enabled,
  frequency: s.frequency,
  hour: String(s.hour),
  retention: String(s.retention),
});

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

const hourLabel = (h: number) => {
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${suffix}`;
};

export function BackupSettings() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState<ScheduleForm | null>(null);
  const [saved, setSaved] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BackupInfo | null>(null);

  const apply = (overview: Overview, resetForm: boolean) => {
    setData(overview);
    if (resetForm) {
      const next = toForm(overview.settings);
      setForm(next);
      setSaved(JSON.stringify(next));
    }
  };

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Overview>("/admin/backups")
      .then((o) => !cancelled && apply(o, true))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (error) return (
      <LoadError
        what="database backups"
        onRetry={() => {
          setError(false);
          setReloadKey((k) => k + 1);
        }}
      />
    );

  if (!data || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  const refresh = async (resetForm = false) => {
    const o = await api.get<Overview>("/admin/backups");
    apply(o, resetForm);
  };

  const latest = data.backups[0];
  const totalSize = data.backups.reduce((sum, b) => sum + b.size, 0);
  const dirty = JSON.stringify(form) !== saved;
  const retentionValid =
    Number.isInteger(Number(form.retention)) && Number(form.retention) >= 1 && Number(form.retention) <= 90;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const b = await api.post<BackupInfo>("/admin/backups");
      toast.success(`Backup created (${b.rows.toLocaleString()} records, ${formatSize(b.size)})`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backup failed");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!retentionValid) return toast.error("Keep between 1 and 90 automatic backups.");
    setSaving(true);
    try {
      await api.put("/admin/backups/settings", {
        enabled: form.enabled,
        frequency: form.frequency,
        hour: Number(form.hour),
        retention: Number(form.retention),
      });
      await refresh(true);
      toast.success("Backup schedule saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (b: BackupInfo) => {
    setDownloading(b.name);
    try {
      await downloadFile(`/admin/backups/${b.name}/download`, b.name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border/50">
        <CardHeader className="flex flex-col gap-3 p-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Database className="size-4" /> Database backup
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A full export of every table, compressed into one file you can download. Backups include user
              data, so keep the files private.
            </p>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="shrink-0">
            {creating ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <HardDriveDownload data-icon="inline-start" />}
            {creating ? "Backing up…" : "Back up now"}
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Last backup</p>
            <p className="mt-1 text-sm font-semibold">{latest ? formatDate(latest.createdAt) : "Never"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Backups stored</p>
            <p className="mt-1 text-sm font-semibold">{data.backups.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Disk used</p>
            <p className="mt-1 text-sm font-semibold">{formatSize(totalSize)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="size-4" /> Automatic backups
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Runs on the server at the time below (server time). Manual backups are never deleted automatically.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="backup-auto">Enable automatic backups</Label>
              <p className="text-xs text-muted-foreground">
                {data.settings.enabled && data.nextRunAt
                  ? `Next backup: ${formatDate(data.nextRunAt)}`
                  : "Automatic backups are off."}
              </p>
            </div>
            <Switch
              id="backup-auto"
              checked={form.enabled}
              onCheckedChange={(enabled) => setForm({ ...form, enabled })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="backup-frequency">Frequency</Label>
              <Select
                value={form.frequency}
                disabled={!form.enabled}
                onValueChange={(v) => v && setForm({ ...form, frequency: v as ScheduleForm["frequency"] })}
              >
                <SelectTrigger id="backup-frequency" className="w-full">
                  <SelectValue>{(v: string) => (v === "weekly" ? "Every week" : "Every day")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="daily">Every day</SelectItem>
                    <SelectItem value="weekly">Every week</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backup-hour">Time</Label>
              <Select
                value={form.hour}
                disabled={!form.enabled}
                onValueChange={(v) => v && setForm({ ...form, hour: v })}
              >
                <SelectTrigger id="backup-hour" className="w-full">
                  <SelectValue>{(v: string) => hourLabel(Number(v))}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectGroup>
                    {Array.from({ length: 24 }, (_, h) => (
                      <SelectItem key={h} value={String(h)}>
                        {hourLabel(h)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backup-retention">Keep last</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="backup-retention"
                  type="number"
                  min={1}
                  max={90}
                  value={form.retention}
                  disabled={!form.enabled}
                  aria-invalid={!retentionValid}
                  onChange={(e) => setForm({ ...form, retention: e.target.value })}
                />
                <span className="shrink-0 text-sm text-muted-foreground">backups</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Save schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Backup history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.backups.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No backups yet. Use “Back up now” to create the first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Created</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.backups.map((b) => (
                    <TableRow key={b.name}>
                      <TableCell className="text-sm">{formatDate(b.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={b.type === "auto" ? "secondary" : "outline"} className="capitalize">
                          {b.type === "auto" ? "Automatic" : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {b.rows ? b.rows.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatSize(b.size)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Download ${b.name}`}
                            disabled={downloading === b.name}
                            onClick={() => handleDownload(b)}
                          >
                            {downloading === b.name ? <Loader2 className="animate-spin" /> : <Download />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${b.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setToDelete(b)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this backup?"
        description={
          toDelete ? `The backup from ${formatDate(toDelete.createdAt)} will be permanently deleted from the server.` : ""
        }
        confirmLabel="Delete backup"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          await api.delete(`/admin/backups/${toDelete.name}`);
          toast.success("Backup deleted");
          setToDelete(null);
          await refresh();
        }}
      />
    </div>
  );
}
