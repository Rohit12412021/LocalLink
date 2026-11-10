"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Shield, Smartphone } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage } from "@/components/ui/form-message";
import { useAuth } from "@/context/auth-context";
import { sendPhoneVerification, verifyPhone } from "@/lib/api";
import { ApiError } from "@/lib/api";

export default function VerifyPhonePage() {
  const { user, loading: authLoading, refreshMe } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"enter-phone" | "enter-code">("enter-phone");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?returnUrl=/verify-phone");
      return;
    }
    if (user.phoneVerified) {
      router.replace("/profile");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSendCode() {
    const trimmed = phone.trim();
    if (trimmed.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendPhoneVerification(trimmed);
      setStep("enter-code");
      setCountdown(60);
      toast.success("Verification code sent");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to send verification code.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyPhone(code);
      await refreshMe();
      toast.success("Phone verified successfully");
      router.replace("/profile");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Invalid verification code.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand" />
      </main>
    );
  }

  return (
    <AuthShell
      eyebrow="Account security"
      title={step === "enter-phone" ? "Verify your phone" : "Enter the code"}
      subtitle={
        step === "enter-phone"
          ? "Add a phone number to secure your account and enable updates."
          : `We sent a 6-digit code to ${phone}.`
      }
      footer={
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="font-semibold text-brand hover:underline"
        >
          Skip for now
        </button>
      }
    >
      {error ? (
        <FormMessage variant="error" className="mb-5">
          {error}
        </FormMessage>
      ) : null}

      {step === "enter-phone" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="label">
              Phone number
            </label>
            <div className="relative">
              <Smartphone
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input pl-10"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading}
            className="btn btn-brand btn-block btn-lg"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Sending..." : "Send verification code"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="code" className="label">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              maxLength={6}
              className="input text-center text-2xl font-bold tracking-[0.4em]"
            />
          </div>
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="btn btn-brand btn-block btn-lg"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Verifying..." : "Verify phone"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep("enter-phone")}
              className="font-medium text-ink-mute hover:text-ink"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || loading}
              className="font-semibold text-brand hover:underline disabled:text-ink-faint disabled:no-underline"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 border-t border-line pt-5">
        <Shield size={18} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-xs text-ink-mute">
          Phone verification protects your account and helps providers reach you
          about active bookings.
        </p>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
        <CheckCircle2 size={13} />
        Your number is never shown publicly.
      </p>
    </AuthShell>
  );
}