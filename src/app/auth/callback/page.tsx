"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/auth-context";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const { bootstrapWithToken } = useAuth();
  const [failed, setFailed] = useState(!token || Boolean(errorParam));
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (!token || errorParam) {
      const timer = setTimeout(
        () => router.replace("/login?error=oauth_failed"),
        1600,
      );
      return () => clearTimeout(timer);
    }

    let alive = true;
    (async () => {
      try {
        const me = await bootstrapWithToken(token);
        if (!alive) return;
        router.replace(me.role === "Provider" ? "/dashboard" : "/home");
      } catch {
        if (!alive) return;
        setFailed(true);
        setTimeout(() => router.replace("/login?error=oauth_failed"), 1600);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, errorParam, bootstrapWithToken, router]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Loader2 size={26} className={failed ? "" : "animate-spin"} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-ink">
          {failed ? "Sign-in failed" : "Signing you in"}
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          {failed
            ? "Redirecting you back to the login page..."
            : "Verifying your Google account, hang tight..."}
        </p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-brand" />
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}