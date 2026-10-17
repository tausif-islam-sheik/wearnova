import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SpecRowProps {
  label: string;
  value: string;
  tooltip?: string;
}

export function SpecRow({ label, value, tooltip }: SpecRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-foreground font-medium capitalize">{value}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger className="inline-flex">
              <Info className="size-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[220px]">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
