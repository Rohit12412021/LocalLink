"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Inbox,
  Plus,
  Star,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  createService,
  deleteService,
  getMyProviderProfile,
  getProviderInbox,
  updateMyProviderProfile,
} from "@/lib/api";
import type { Provider, ProviderService, ServiceRequest } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<Provider | null>(null);
  const [inbox, setInbox] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [addingService, setAddingService] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      await Promise.resolve();
      setLoading(true);
      setError("");
      const [profileData, inboxData] = await Promise.all([
        getMyProviderProfile(),
        getProviderInbox().catch(() => [] as ServiceRequest[]),
      ]);
      setProfile(profileData);
      setInbox(inboxData);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unable to load provider dashboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?returnUrl=/dashboard");
      return;
    }
    if (user.role !== "Provider") {
      router.replace("/home");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [profileData, inboxData] = await Promise.all([
          getMyProviderProfile(),
          getProviderInbox().catch(() => [] as ServiceRequest[]),
        ]);
        if (!alive) return;
        setProfile(profileData);
        setInbox(inboxData);
        setError("");
        setLoading(false);
      } catch (err) {
        if (!alive) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Unable to load provider dashboard.";
        setError(message);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, authLoading, router]);

  async function handleToggleAvailability() {
    if (!profile) return;
    try {
      setTogglingAvailability(true);
      const updated = await updateMyProviderProfile({
        available: !profile.available,
      });
      setProfile(updated);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unable to update availability.";
      setError(message);
    } finally {
      setTogglingAvailability(false);
    }
  }

  async function handleAddService(e: FormEvent) {
    e.preventDefault();
    if (!serviceName.trim() || !servicePrice.trim()) return;

    try {
      setAddingService(true);
      const updated = await createService({
        name: serviceName.trim(),
        price: servicePrice.trim(),
        description: serviceDesc.trim() || undefined,
      });
      setProfile(updated);
      setServiceName("");
      setServicePrice("");
      setServiceDesc("");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to add service.";
      setError(message);
    } finally {
      setAddingService(false);
    }
  }

  async function handleDeleteService(service: ProviderService) {
    if (!service.id) return;
    try {
      setDeletingId(service.id);
      const updated = await deleteService(service.id);
      setProfile(updated);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to delete service.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <p className="text-red-700">{error || "Profile not found."}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-4 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = inbox.filter((r) => r.status === "Pending").length;
  const acceptedCount = inbox.filter((r) => r.status === "Accepted").length;
  const completedCount = inbox.filter((r) => r.status === "Completed").length;

  const stats = [
    { label: "Pending", value: pendingCount, color: "text-amber-700 bg-amber-50" },
    { label: "Accepted", value: acceptedCount, color: "text-teal-700 bg-teal-50" },
    { label: "Completed", value: completedCount, color: "text-emerald-700 bg-emerald-50" },
    { label: "Services", value: profile.services.length, color: "text-slate-700 bg-slate-50" },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Provider Dashboard
            </h1>
            <p className="text-sm text-slate-600">{profile.name}</p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={togglingAvailability}
            onClick={handleToggleAvailability}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              profile.available
                ? "border-teal-200 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {profile.available ? (
              <ToggleRight className="h-5 w-5" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
            {profile.available ? "Available" : "Unavailable"}
          </motion.button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${stat.color.split(" ")[1]}`}
            >
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className={`mt-1 text-3xl font-bold ${stat.color.split(" ")[0]}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/provider-requests"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-800"
          >
            <Inbox className="h-4 w-4" />
            View Inbox
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-teal-700" />
            <h2 className="text-lg font-bold text-slate-900">Your Services</h2>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-slate-600">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {profile.rating} ({profile.reviewCount} reviews)
          </div>

          <motion.form
            onSubmit={handleAddService}
            className="mt-6 rounded-xl border border-dashed border-teal-200 bg-teal-50/30 p-4"
          >
            <p className="text-sm font-semibold text-slate-800">Add a service</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Service name"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
              />
              <input
                type="text"
                placeholder="Price (e.g. ₹500 onwards)"
                required
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <motion.button
              type="submit"
              disabled={addingService}
              whileTap={{ scale: 0.98 }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {addingService ? "Adding..." : "Add Service"}
            </motion.button>
          </motion.form>

          <div className="mt-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {profile.services.map((service, i) => (
                <motion.div
                  key={service.id || service.name}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    <p className="text-sm font-medium text-teal-700">
                      {service.price}
                    </p>
                    {service.description && (
                      <p className="mt-1 text-xs text-slate-500">
                        {service.description}
                      </p>
                    )}
                  </div>
                  {service.id && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      disabled={deletingId === service.id}
                      onClick={() => handleDeleteService(service)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Delete ${service.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {profile.services.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No services yet. Add your first service above.
              </p>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
