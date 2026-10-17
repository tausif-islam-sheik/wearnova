import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  label: string;
  children: ReactNode;
  align?: "center" | "start";
}

export function SettingsRow({ label, children, align = "center" }: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4 px-6 py-5",
        align === "start" ? "items-start" : "items-center"
      )}
    >
      <span className="text-sm font-medium text-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-3 shrink-0">{children}</div>
    </div>
  );
}
