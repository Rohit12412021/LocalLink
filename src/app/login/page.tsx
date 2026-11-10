"use client";

import { Suspense, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { FormMessage } from "@/components/ui/form-message";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/home";
  const oauthError = searchParams.get("error");
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsVerification =
    error.toLowerCase().includes("verify") ||
    error.toLowerCase().includes("verification");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login({ email: email.trim(), password });
      const destination =
        user.role === "Provider" && returnUrl === "/home"
          ? "/dashboard"
          : returnUrl;
      router.push(destination);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to LocalLink"
      subtitle="Book trusted local pros or manage your business."
      footer={
        <>
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {oauthError ? (
        <FormMessage variant="error" className="mb-5">
          Google sign-in could not be completed. Please try again or use your
          email and password.
        </FormMessage>
      ) : null}

      <GoogleButton label="Continue with Google" />
      <AuthDivider />

      {error ? (
        <FormMessage variant="error" className="mb-5">
          {error}
          {needsVerification ? (
            <>
              {" "}
              <Link
                href={`/verify-email?email=${encodeURIComponent(email.trim())}`}
                className="font-semibold underline"
              >
                Resend verification email
              </Link>
              .
            </>
          ) : null}
        </FormMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <div className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-xs font-semibold text-brand hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
            />
            <PasswordInput
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="pl-10"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-brand btn-block btn-lg mt-2">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-ink-mute">Loading...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}