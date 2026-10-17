import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/container";

export function ProductPageSkeleton() {
  return (
    <Container className="py-6">
      <Skeleton className="mb-4 h-5 w-64" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <div className="flex gap-3">
          <div className="hidden w-20 flex-col gap-2 md:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="aspect-[4/5] flex-1 rounded-xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </Container>
  );
}
