"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage } from "@/components/ui/form-message";
import { fetcher, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await fetcher("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to process request."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`We've sent a password reset link to ${email}`}
        footer={
          <Link href="/login" className="font-semibold text-brand hover:underline flex items-center justify-center gap-1">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        }
      >
        <div className="mt-6 flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Mail size={32} />
          </div>
          <p className="text-center text-sm text-ink-mute">
            Click the link in the email to reset your password. If you don't see it, check your spam folder.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
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

        <button type="submit" disabled={loading} className="btn btn-brand btn-block btn-lg mt-2">
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}