"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsLinkRowProps {
  label: string;
  description?: string;
  onClick?: () => void;
  variant?: "card" | "row";
}

export function SettingsLinkRow({
  label,
  description,
  onClick,
  variant = "card",
}: SettingsLinkRowProps) {
  return (
    <div
      onClick={onClick ?? (() => { /* TODO: wire to actual navigation or modal flow */ })}
      className={cn(
        "flex cursor-pointer items-center justify-between px-6 py-5 transition-colors hover:bg-muted/50",
        variant === "card" && "rounded-lg border border-border"
      )}
    >
      <div className="flex flex-col">
        <span
          className={cn(
            "font-medium text-foreground",
            description ? "text-base" : "text-sm"
          )}
        >
          {label}
        </span>
        {description && (
          <span className="text-sm text-foreground-muted">{description}</span>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-foreground-muted" strokeWidth={1.5} />
    </div>
  );
}
