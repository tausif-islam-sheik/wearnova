"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** Runs when the admin confirms. The dialog stays open (with a spinner) until it settles, and stays open if it throws. */
  onConfirm: () => void | Promise<void>;
}

/** Shared confirmation step for destructive admin actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // The caller reports the failure (toast); keep the dialog open so the admin can retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogContent size="sm">
          <AlertDialogTitle className="text-center text-base font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-2 grid grid-cols-2 gap-2">
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button
              size="sm"
              variant={destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={busy}
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
