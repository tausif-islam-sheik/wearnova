import { Card } from "@/components/ui/card";

interface PriceProps {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "inline" | "card";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-3xl tracking-tight",
  "2xl": "text-2xl tracking-tight",
} as const;

export function Price({
  price,
  originalPrice,
  size = "md",
  variant = "inline",
  className,
}: PriceProps) {
  const content = (
    <div className={className}>
      {originalPrice !== undefined && (
        <span className="mr-2 align-middle text-sm text-muted-foreground line-through">
          ${originalPrice.toFixed(2)}
        </span>
      )}
      <span className={`font-bold text-brand-primary ${sizeClasses[size]}`}>
        ${price.toFixed(2)}
      </span>
    </div>
  );

  if (variant === "card") {
    return (
      <Card className="border rounded p-4 bg-muted/20">
        {content}
      </Card>
    );
  }

  return content;
}
