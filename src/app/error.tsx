"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle size={30} />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="max-w-md text-ink-mute">
        An unexpected error occurred while loading this page. You can try again,
        and we have logged the details.
      </p>
      <button type="button" onClick={reset} className="btn btn-brand mt-2">
        <RefreshCw size={16} />
        Try again
      </button>
    </main>
  );
}