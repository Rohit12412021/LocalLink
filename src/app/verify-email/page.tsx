"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { fetcher, ApiError } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">(token ? "loading" : "idle");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    async function verify() {
      try {
        await fetcher("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (mounted) setStatus("success");
      } catch (err) {
        if (mounted) {
          setStatus("error");
          setError(err instanceof ApiError ? err.message : "Verification failed");
        }
      }
    }
    verify();
    return () => { mounted = false; };
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await fetcher("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResendSuccess(true);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (status === "loading") {
    return (
      <AuthShell title="Verifying your email" subtitle="Please wait a moment...">
        <div className="mt-8 flex justify-center text-brand">
          <Loader2 size={40} className="animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell title="Email verified!" subtitle="Thank you for confirming your email address.">
        <div className="mt-6 flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={32} />
          </div>
          <Link href="/login" className="btn btn-brand w-full mt-4">
            Continue to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell title="Verification failed" subtitle="The link may be expired or invalid.">
        <div className="mt-6 flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger">
            <XCircle size={32} />
          </div>
          <p className="text-center text-sm text-danger font-medium">{error}</p>

          {/* Let user get a fresh link if email is known */}
          {email ? (
            <>
              {resendSuccess ? (
                <p className="text-center text-sm font-semibold text-success">
                  A new verification link has been sent to {email}. Check your inbox.
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="btn btn-brand w-full"
                >
                  {resending ? "Sending..." : "Send a new verification link"}
                </button>
              )}
            </>
          ) : (
            <p className="text-center text-xs text-ink-mute">
              Go back to login and use the &quot;Resend verification email&quot; option.
            </p>
          )}

          <Link href="/login" className="btn btn-outline w-full">
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a verification link to ${email || "your email"}.`}
      footer={
        <Link href="/login" className="font-semibold text-brand hover:underline flex items-center justify-center gap-1">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      }
    >
      <div className="mt-4 flex flex-col items-center space-y-4">
        <p className="text-center text-sm text-ink-mute">
          You must verify your email before you can log in. If you didn't receive the email, check your spam folder or request a new one.
        </p>
        {email && (
          <button
            onClick={handleResend}
            disabled={resending || resendSuccess}
            className="btn btn-brand w-full"
          >
            {resending ? "Sending..." : resendSuccess ? "Verification Sent!" : "Resend Verification Email"}
          </button>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-ink-mute">Loading...</p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}