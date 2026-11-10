"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage } from "@/components/ui/form-message";
import { PasswordInput } from "@/components/ui/password-input";
import { fetcher, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await fetcher("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="Password reset!" subtitle="Your password has been successfully updated.">
        <div className="mt-6 flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={32} />
          </div>
          <p className="text-center text-sm text-ink-mute">
            Redirecting you to login...
          </p>
          <Link href="/login" className="btn btn-brand w-full mt-4">
            Go to login now
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create new password"
      subtitle="Enter your new password below."
      footer={
        <Link href="/login" className="font-semibold text-brand hover:underline flex items-center justify-center gap-1">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      }
    >
      {error && (
        <FormMessage variant="error" className="mb-5">
          {error}
        </FormMessage>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">
            New Password
          </label>
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
            />
            <PasswordInput
              id="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="pl-10"
            />
          </div>
        </div>

        <button type="submit" disabled={loading || !token} className="btn btn-brand btn-block btn-lg mt-2">
          {loading ? "Saving..." : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-ink-mute">Loading...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}