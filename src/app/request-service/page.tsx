
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, CalendarCheck, Check, Clock, MapPin, Sparkles } from "lucide-react";

import { FormMessage } from "@/components/ui/form-message";
import { useAuth } from "@/context/auth-context";
import { ApiError, createRequest, getProviderById, suggestPrice } from "@/lib/api";
import type { AuthUser, Provider } from "@/types";

function RequestForm({
  provider,
  user,
}: {
  provider: Provider;
  user: AuthUser;
}) {
  const router = useRouter();

  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState(user.location ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [priceHint, setPriceHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedService = provider.services.find((item) => item.name === service);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await suggestPrice(provider.category, service);
        if (cancelled) return;
        setPriceHint(
          result.suggestedPrice || result.price ||
            (result.min && result.max ? `₹${result.min} – ₹${result.max}` : ""),
        );
      } catch {
        if (!cancelled) setPriceHint("");
      }
    })();
    return () => { cancelled = true; };
  }, [provider.category, service]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!service) {
      setError("Please select a service.");
      return;
    }
    if (description.trim().length < 5) {
      setError("Please describe the problem in at least 5 characters.");
      return;
    }
    if (!date || !time) {
      setError("Please pick a preferred date and time.");
      return;
    }
    if (!location.trim()) {
      setError("Please enter your location.");
      return;
    }
    if (!phone.trim() || !/^[+0-9\s()-]{7,20}$/.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const newRequest = await createRequest({
        providerId: provider.id,
        providerName: provider.name,
        category: provider.category,
        service,
        description: description.trim(),
        date,
        time,
        location: location.trim(),
        phone: phone.trim(),
        price: selectedService?.price ?? (priceHint || "₹0"),
      });
      router.push(`/booking-confirmed?id=${encodeURIComponent(newRequest.id)}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to submit your request. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-3xl px-4 py-10">
      <Link
        href={`/provider/${provider.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        ← Back to {provider.name}
      </Link>

      <div className="mt-4">
        <span className="badge badge-accent mb-3">New request</span>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Book a service
        </h1>
        <p className="mt-2 text-sm text-ink-mute">
          Signed in as <span className="font-semibold text-ink">{user.name}</span>.
          Your contact details are pre-filled below.
        </p>
      </div>

      {/* Provider summary */}
      <section className="card mt-6 flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-extrabold text-brand">
          {provider.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-ink">
            {provider.name}
          </h2>
          <p className="mt-0.5 truncate text-sm text-ink-mute">
            {provider.category} • {provider.location}
          </p>
        </div>
        <span
          className={`badge ml-auto ${
            provider.available ? "badge-success" : "badge-muted"
          }`}
        >
          {provider.available ? "Available" : "Busy"}
        </span>
      </section>

      {error ? (
        <FormMessage variant="error" className="mt-5">
          {error}
        </FormMessage>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">

        {/* Service selection */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-ink">What service do you need?</h2>

          {provider.services.length === 0 ? (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning-soft p-5 text-center">
              <p className="font-semibold text-ink">This provider has no services listed yet.</p>
              <p className="mt-1 text-sm text-ink-mute">
                The provider hasn&apos;t added any services to their profile. Try another provider.
              </p>
              <Link href="/search" className="btn btn-outline btn-sm mt-4">
                ← Browse other providers
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {provider.services.map((item) => {
                const active = service === item.name;
                return (
                  <label
                    key={item.name}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
                      active
                        ? "border-brand bg-brand-soft/50"
                        : "border-line hover:border-brand/50 hover:bg-surface-soft/50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-brand bg-brand" : "border-ink-faint"}`}>
                        {active ? <Check size={12} className="text-white" /> : null}
                      </span>
                      <span className="font-medium text-ink">{item.name}</span>
                    </span>
                    <span className="text-sm font-bold text-brand">{item.price}</span>
                    <input type="radio" name="service" value={item.name} checked={active}
                      onChange={(e) => setService(e.target.value)} className="sr-only" />
                  </label>
                );
              })}
            </div>
          )}

          {priceHint ? (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong">
              <Sparkles size={16} className="shrink-0" />
              Smart price suggestion: {priceHint}
            </p>
          ) : null}
        </section>

        {/* Description */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-ink">Describe your problem</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: My car is not starting..."
            rows={4}
            className="input mt-4 resize-none"
          />
        </section>

        {/* Schedule */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-ink">When do you need it?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="label">
                Preferred date
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label htmlFor="time" className="label">
                Preferred time
              </label>
              <div className="relative">
                <Clock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Location + contact */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-ink">Where should the provider come?</h2>
          <div className="mt-4 relative">
            <MapPin
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your full address"
              className="input pl-9"
            />
          </div>

          <label htmlFor="phone" className="label mt-5">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="input"
          />
        </section>

        <button
          type="submit"
          disabled={loading || provider.services.length === 0}
          className="btn btn-brand btn-block btn-lg"
        >
          {loading ? "Submitting request..." : "Submit service request"}
        </button>
      </form>
    </main>
  );
}

function RequestServiceFlow() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get("provider");
  const { user, loading: authLoading } = useAuth();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [providerError, setProviderError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    // No redirect — show inline login prompt instead
  }, [authLoading]);

  useEffect(() => {
    if (!providerId) return;
    let alive = true;
    (async () => {
      try {
        const data = await getProviderById(providerId);
        if (alive) setProvider(data);
      } catch (err) {
        if (alive)
          setProviderError(
            err instanceof ApiError
              ? err.message
              : "Unable to load provider details.",
          );
      } finally {
        if (alive) setProviderLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [providerId]);

  if (authLoading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </main>
    );
  }

  // Inline login prompt — user stays on page context
  if (!user) {
    const returnUrl = providerId
      ? `/request-service?provider=${encodeURIComponent(providerId)}`
      : "/request-service";
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
            <CalendarCheck size={28} className="text-brand" />
          </div>
          <h1 className="mt-5 text-xl font-extrabold text-ink">Sign in to book a service</h1>
          <p className="mt-2 text-sm text-ink-mute">
            Create a free account or sign in to submit your service request.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="btn btn-brand btn-block">
              Sign in
            </Link>
            <Link href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="btn btn-outline btn-block">
              Create free account
            </Link>
            {providerId && (
              <Link href={`/provider/${providerId}`} className="btn btn-ghost btn-sm mt-1">
                ← Back to provider
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!providerId) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-ink">No provider selected</h1>
          <p className="mt-2 text-sm text-ink-mute">
            Please pick a provider from the directory first.
          </p>
          <Link href="/search" className="btn btn-brand mt-5">
            Browse providers
          </Link>
        </div>
      </main>
    );
  }

  if (providerLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col gap-4 px-4 py-10">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-20" />
        <div className="skeleton h-40" />
        <div className="skeleton h-24" />
      </main>
    );
  }

  if (providerError || !provider) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-ink">Provider not found</h1>
          <p className="mt-2 text-sm text-ink-mute">
            {providerError || "This provider no longer exists."}
          </p>
          <Link href="/search" className="btn btn-brand mt-5">
            Browse providers
          </Link>
        </div>
      </main>
    );
  }

  return <RequestForm provider={provider} user={user} />;
}

export default function RequestServicePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-ink-mute">Loading form...</p>
        </main>
      }
    >
      <RequestServiceFlow />
    </Suspense>
  );
}
