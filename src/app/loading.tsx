export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="flex items-center gap-2 font-bold tracking-tight text-brand">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand text-white text-sm">
          L
        </span>
        LocalLink
      </div>
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="skeleton h-5 w-2/3 self-start" />
        <div className="skeleton h-5 w-1/3 self-start" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    </main>
  );
}