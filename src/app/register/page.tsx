"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Lock,
  Mail,
  MapPin,
  Phone,
  Store,
  Tags,
  User,
  UserCircle,
} from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { FormMessage } from "@/components/ui/form-message";
import { PasswordChecklist } from "@/components/ui/password-checklist";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { isStrongPassword } from "@/lib/password";
import { categories } from "@/data/categories";

type SignupRole = "User" | "Provider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<SignupRole>("User");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = isStrongPassword(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please choose a stronger password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        role,
        businessName: role === "Provider" ? businessName.trim() : undefined,
        category: role === "Provider" ? category : undefined,
      });

      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Register with your email — customers book, providers list services."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" />
      <AuthDivider />

      {/* Role toggle */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-surface-soft p-1">
        {[
          { value: "User" as const, label: "Customer", icon: UserCircle },
          { value: "Provider" as const, label: "Provider", icon: Briefcase },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            aria-pressed={role === value}
            className={
              role === value
                ? "flex items-center justify-center gap-2 rounded-lg bg-surface py-2.5 text-sm font-semibold text-brand shadow-sm"
                : "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-ink-mute transition-colors hover:text-ink"
            }
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <FormMessage variant="error" className="mt-5">
          {error}
        </FormMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <div className="relative">
            <User
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="input pl-10"
            />
          </div>
        </div>

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
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
            />
            <PasswordInput
              id="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="pl-10"
            />
          </div>
          <PasswordChecklist password={password} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="label">
              Phone <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <div className="relative">
              <Phone
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
          <div>
            <label htmlFor="location" className="label">
              Location{" "}
              <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <div className="relative">
              <MapPin
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Your area"
                className="input pl-10"
              />
            </div>
          </div>
        </div>

        {role === "Provider" ? (
          <div className="space-y-4 border-t border-line pt-4">
            <div>
              <label htmlFor="businessName" className="label">
                Business name
              </label>
              <div className="relative">
                <Store
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="businessName"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sharma Auto Works"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="label">
                Service category
              </label>
              <div className="relative">
                <Tags
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input appearance-none pl-10"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn btn-brand btn-block btn-lg mt-2"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-xs text-ink-faint">
          We&apos;ll email you a link to verify your address before you can sign
          in.
        </p>
      </form>
    </AuthShell>
  );
}