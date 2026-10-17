import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-lg text-foreground-muted mb-1">Page not found</p>
      <p className="text-sm text-foreground-faint mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button className="bg-brand-primary text-white hover:bg-brand-primary-hover">
          Back to home
        </Button>
      </Link>
    </div>
  );
}
