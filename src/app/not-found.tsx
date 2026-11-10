import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
        <Compass size={30} />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">
        404 — Off the beaten path
      </h1>
      <p className="max-w-md text-ink-mute">
        We could not find that page. It may have moved, or the link is out of
        date.
      </p>
      <Link href="/" className="btn btn-brand mt-2">
        <Home size={16} />
        Back home
      </Link>
    </main>
  );
}