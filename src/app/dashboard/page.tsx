"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Inbox, Plus, Star, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { ApiError, createService, deleteService, getMyProviderProfile, getProviderInbox, updateMyProviderProfile } from "@/lib/api";
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
      setLoading(true); setError("");
      const [profileData, inboxData] = await Promise.all([
        getMyProviderProfile(),
        getProviderInbox().catch(() => [] as ServiceRequest[]),
      ]);
      setProfile(profileData); setInbox(inboxData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load provider dashboard.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?returnUrl=/dashboard"); return; }
    if (user.role !== "Provider") { router.replace("/home"); return; }
    let alive = true;
    (async () => {
      try {
        const [profileData, inboxData] = await Promise.all([
          getMyProviderProfile(),
          getProviderInbox().catch(() => [] as ServiceRequest[]),
        ]);
        if (!alive) return;
        setProfile(profileData); setInbox(inboxData); setError(""); setLoading(false);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof ApiError ? err.message : "Unable to load provider dashboard.");
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user, authLoading, router]);

  async function handleToggleAvailability() {
    if (!profile) return;
    try {
      setTogglingAvailability(true);
      const updated = await updateMyProviderProfile({ available: !profile.available });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update availability.");
    } finally { setTogglingAvailability(false); }
  }

  async function handleAddService(e: FormEvent) {
    e.preventDefault();
    if (!serviceName.trim() || !servicePrice.trim()) return;
    try {
      setAddingService(true);
      const updated = await createService({ name: serviceName.trim(), price: servicePrice.trim(), description: serviceDesc.trim() || undefined });
      setProfile(updated); setServiceName(""); setServicePrice(""); setServiceDesc("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to add service.");
    } finally { setAddingService(false); }
  }

  async function handleDeleteService(service: ProviderService) {
    if (!service.id) return;
    try {
      setDeletingId(service.id);
      const updated = await deleteService(service.id);
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete service.");
    } finally { setDeletingId(null); }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-mute">Loading dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <div className="card max-w-md p-8 text-center">
          <p className="text-danger">{error || "Profile not found."}</p>
          <button type="button" onClick={loadDashboard} className="btn btn-brand mt-4">Try Again</button>
        </div>
      </div>
    );
  }

  const pendingCount = inbox.filter(r => r.status === "Pending").length;
  const acceptedCount = inbox.filter(r => r.status === "Accepted").length;
  const completedCount = inbox.filter(r => r.status === "Completed").length;

  const stats = [
    { label: "Pending",   value: pendingCount,            colorText: "text-warning",  colorBg: "bg-warning-soft" },
    { label: "Accepted",  value: acceptedCount,           colorText: "text-brand",    colorBg: "bg-brand-soft" },
    { label: "Completed", value: completedCount,          colorText: "text-success",  colorBg: "bg-success-soft" },
    { label: "Services",  value: profile.services.length, colorText: "text-ink",      colorBg: "bg-surface-soft" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">Provider Dashboard</h1>
          <p className="text-sm text-ink-mute">{profile.name}</p>
        </div>
        <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={togglingAvailability}
          onClick={handleToggleAvailability}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            profile.available ? "border-success/40 bg-success-soft text-success" : "border-line bg-surface text-ink-mute"
          }`}
        >
          {profile.available ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          {profile.available ? "Available" : "Unavailable"}
        </motion.button>
      </div>

      {error && <div className="mt-6 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`card p-5 ${stat.colorBg}`}
          >
            <p className="text-sm font-medium text-ink-mute">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.colorText}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/provider-requests" className="btn btn-brand">
          <Inbox className="h-4 w-4" />
          View Inbox
          {pendingCount > 0 && (
            <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-white">{pendingCount}</span>
          )}
        </Link>
      </div>

      <section className="card mt-8 p-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-ink">Your Services</h2>
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-ink-mute">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {profile.rating} ({profile.reviewCount} reviews)
        </div>

        <motion.form onSubmit={handleAddService} className="mt-6 rounded-xl border border-dashed border-brand/30 bg-brand-soft/20 p-4">
          <p className="text-sm font-semibold text-ink">Add a service</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input type="text" placeholder="Service name" required value={serviceName}
              onChange={e => setServiceName(e.target.value)} className="input text-sm" />
            <input type="text" placeholder="Price (e.g. ₹500 onwards)" required value={servicePrice}
              onChange={e => setServicePrice(e.target.value)} className="input text-sm" />
            <input type="text" placeholder="Description (optional)" value={serviceDesc}
              onChange={e => setServiceDesc(e.target.value)} className="input text-sm" />
          </div>
          <motion.button type="submit" disabled={addingService} whileTap={{ scale: 0.98 }} className="btn btn-brand mt-3">
            <Plus className="h-4 w-4" />
            {addingService ? "Adding..." : "Add Service"}
          </motion.button>
        </motion.form>

        <div className="mt-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {profile.services.map((service, i) => (
              <motion.div key={service.id || service.name} layout
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.04 }}
                className="card flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-semibold text-ink">{service.name}</p>
                  <p className="text-sm font-medium text-brand">{service.price}</p>
                  {service.description && <p className="mt-1 text-xs text-ink-mute">{service.description}</p>}
                </div>
                {service.id && (
                  <motion.button type="button" whileTap={{ scale: 0.95 }} disabled={deletingId === service.id}
                    onClick={() => handleDeleteService(service)}
                    className="btn btn-danger btn-sm p-2" aria-label={`Delete ${service.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {profile.services.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-mute">No services yet. Add your first service above.</p>
          )}
        </div>
      </section>
    </motion.div>
  );
}
