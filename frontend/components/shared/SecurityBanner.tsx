import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface SecurityBannerProps {
  children?: ReactNode;
}

export function SecurityBanner({ children }: SecurityBannerProps) {
  return (
    <div className="flex gap-4 rounded-lg bg-surface-muted p-6">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary">
        <Info className="size-5 text-white" strokeWidth={2} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
