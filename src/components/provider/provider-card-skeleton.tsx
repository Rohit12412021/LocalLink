export function ProviderCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-6 w-20" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="skeleton avatar-md rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      </div>
      <div className="skeleton mt-4 h-4 w-1/2" />
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}