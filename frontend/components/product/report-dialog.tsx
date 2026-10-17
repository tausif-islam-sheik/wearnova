"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { REPORT_REASONS, REPORT_REASON_VALUES } from "@/lib/listing-utils";
import { useAuthStore } from "@/stores/useAuthStore";

type Reason = (typeof REPORT_REASONS)[number];

function ReportForm({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Sign in to report</DialogTitle>
          <DialogDescription>
            We ask you to sign in so we can follow up on reports and stop abuse.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
        </DialogFooter>
      </>
    );
  }

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.post("/reports", {
        targetType: "listing",
        targetId: listingId,
        reason: REPORT_REASON_VALUES[reason],
        description: details.trim() || undefined,
      });
      toast.success("Report submitted. Thank you, our team will take a look.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't submit your report");
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Report this item</DialogTitle>
        <DialogDescription>Why are you reporting this item?</DialogDescription>
      </DialogHeader>
      <div role="radiogroup" aria-label="Reason" className="space-y-2">
        {REPORT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={reason === r}
            onClick={() => setReason(r)}
            className={cn(
              "flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left text-sm transition-colors",
              reason === r ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                reason === r ? "border-primary" : "border-muted-foreground/40",
              )}
            >
              {reason === r && <span className="size-2 rounded-full bg-primary" />}
            </span>
            {r}
          </button>
        ))}
      </div>
      <Textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Add details (optional)"
        aria-label="Additional details"
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!reason || submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Submit report
        </Button>
      </DialogFooter>
    </>
  );
}

export function ReportDialog({
  listingId,
  open,
  onOpenChange,
}: {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded">
        <ReportForm listingId={listingId} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
