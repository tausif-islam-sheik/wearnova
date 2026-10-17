"use client";

import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AchievementCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  detail?: string;
}

export function AchievementCard({
  icon: Icon,
  title,
  description,
  detail,
}: AchievementCardProps) {
  return (
    <div className="flex items-start gap-3 rounded border border-border bg-background p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
        <Icon className="size-4 text-brand-primary" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      {detail && (
        <span title={detail} className="shrink-0 mt-0.5 cursor-help">
          <Info className="size-4 text-foreground-faint hover:text-foreground-muted transition-colors" />
        </span>
      )}
    </div>
  );
}
