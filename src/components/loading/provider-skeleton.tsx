import { Skeleton } from "@/components/ui/skeleton";

export function ProviderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProviderListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ProviderCardSkeleton key={i} />
      ))}
    </div>
  );
}
