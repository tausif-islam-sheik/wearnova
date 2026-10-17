"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  value: string;
  label?: string;
  withToast?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  withToast = true,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (withToast) toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Failed to copy");
      }
    },
    [value, withToast]
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
      aria-label={`Copy ${label}: ${value}`}
      title={`Copy ${label}: ${value}`}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}
