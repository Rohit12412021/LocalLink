"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Inbox, Plus, Star, Trash2,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, X,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import {
  ApiError, createService, deleteService,
  getMyProviderProfile, getProviderInbox, updateMyProviderProfile,
} from "@/lib/api";
import type { Provider, ProviderService, ServiceRequest, ServiceSubItem } from "@/types";

type SubItemDraft = { name: string; price: string; description: string };

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<Provider | null>(null);
  const [inbox, setInbox] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add service form
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [subItems, setSubItems] = useState<SubItemDraft[]>([]);
  const [showSubForm, setShowSubForm] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const [p, i] = await Promise.all([
        getMyProviderProfile(),
        getProviderInbox().catch(() => [] as ServiceRequest[]),
      ]);
      setProfile(p); setInbox(i);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load dashboard.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?returnUrl=/dashboard"); return; }
    if (user.role !== "Provider") { router.replace("/home"); return; }
    let alive = true;
    (async () => {
      try {
        const [p, i] = await Promise.all([
          getMyProviderProfile(),
          getProviderInbox().catch(() => [] as ServiceRequest[]),
        ]);
        if (!alive) return;
        setProfile(p); setInbox(i); setLoading(false);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof ApiError ? err.message : "Unable to load dashboard.");
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

  function addSubItem() {
    setSubItems(prev => [...prev, { name: "", price: "", description: "" }]);
  }
  function removeSubItem(i: number) {
    setSubItems(prev => prev.filter((_, idx) => idx !== i));
  }
  function updateSubItem(i: number, field: keyof SubItemDraft, val: string) {
    setSubItems(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }

  async function handleAddService(e: FormEvent) {
    e.preventDefault();
    if (!serviceName.trim() || !servicePrice.trim()) return;
    try {
      setAddingService(true);
      const validSubs = subItems.filter(s => s.name.trim() && s.price.trim());
      const updated = await createService({
        name: serviceName.trim(),
        price: servicePrice.trim(),
        description: serviceDesc.trim() || undefined,
        subItems: validSubs.length > 0
          ? validSubs.map(s => ({ name: s.name.trim(), price: s.price.trim(), description: s.description.trim() || undefined }))
          : undefined,
      });
      setProfile(updated);
      setServiceName(""); setServicePrice(""); setServiceDesc("");
      setSubItems([]); setShowSubForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to add service.");
    } finally { setAddingService(false); }
  }

  async function handleDeleteService(service: ProviderService) {
    if (!service.id) return;
    try {
      setDeletingId(service.id);
      setProfile(await deleteService(service.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete service.");
    } finally { setDeletingId(null); }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-24"><p className="text-ink-mute">Loading dashboard...</p></div>;
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
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

      {error && <div className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</div>}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending",   value: pendingCount,            colorText: "text-warning",  colorBg: "bg-warning-soft" },
          { label: "Accepted",  value: acceptedCount,           colorText: "text-brand",    colorBg: "bg-brand-soft" },
          { label: "Completed", value: completedCount,          colorText: "text-success",  colorBg: "bg-success-soft" },
          { label: "Services",  value: profile.services.length, colorText: "text-ink",      colorBg: "bg-surface-soft" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`card p-5 ${s.colorBg}`}>
            <p className="text-sm font-medium text-ink-mute">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.colorText}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/provider-requests" className="btn btn-brand">
          <Inbox className="h-4 w-4" /> View Inbox
          {pendingCount > 0 && <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-white">{pendingCount}</span>}
        </Link>
      </div>

      {/* Services section */}
      <section className="card mt-8 p-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-ink">Your Services</h2>
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-ink-mute">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {profile.rating} ({profile.reviewCount} reviews)
        </div>

        {/* Add service form */}
        <motion.form onSubmit={handleAddService} className="mt-6 rounded-xl border border-dashed border-brand/30 bg-brand-soft/20 p-4">
          <p className="text-sm font-semibold text-ink">Add a service</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input type="text" placeholder="Service name *" required value={serviceName}
              onChange={e => setServiceName(e.target.value)} className="input text-sm" />
            <input type="text" placeholder="Starting price *  e.g. ₹500" required value={servicePrice}
              onChange={e => setServicePrice(e.target.value)} className="input text-sm" />
            <input type="text" placeholder="Short description" value={serviceDesc}
              onChange={e => setServiceDesc(e.target.value)} className="input text-sm" />
          </div>

          {/* Sub-items (sub-categories with individual prices) */}
          <div className="mt-3">
            <button type="button" onClick={() => setShowSubForm(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
              {showSubForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showSubForm ? "Hide" : "Add"} sub-services / options (optional)
            </button>

            <AnimatePresence>
              {showSubForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="mt-3 space-y-2">
                    {subItems.map((sub, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" placeholder={`Option ${i + 1} name`} value={sub.name}
                          onChange={e => updateSubItem(i, "name", e.target.value)} className="input text-xs flex-1" />
                        <input type="text" placeholder="Price" value={sub.price}
                          onChange={e => updateSubItem(i, "price", e.target.value)} className="input text-xs w-28" />
                        <input type="text" placeholder="Note (optional)" value={sub.description}
                          onChange={e => updateSubItem(i, "description", e.target.value)} className="input text-xs flex-1" />
                        <button type="button" onClick={() => removeSubItem(i)} className="text-danger hover:text-danger/70">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addSubItem}
                      className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                      <Plus size={13} /> Add option
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button type="submit" disabled={addingService} whileTap={{ scale: 0.98 }} className="btn btn-brand mt-3">
            <Plus className="h-4 w-4" />
            {addingService ? "Adding..." : "Add Service"}
          </motion.button>
        </motion.form>

        {/* Existing services */}
        <div className="mt-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {profile.services.map((service, i) => (
              <motion.div key={service.id || service.name} layout
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.03 }}
                className="card overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{service.name}</p>
                      {(service.subItems?.length ?? 0) > 0 && (
                        <span className="badge badge-brand text-[10px]">{service.subItems!.length} options</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-brand">{service.price}</p>
                    {service.description && <p className="mt-0.5 text-xs text-ink-mute">{service.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {(service.subItems?.length ?? 0) > 0 && (
                      <button type="button"
                        onClick={() => setExpandedService(expandedService === service.id ? null : (service.id ?? null))}
                        className="btn btn-ghost btn-sm p-1.5">
                        {expandedService === service.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                    {service.id && (
                      <motion.button type="button" whileTap={{ scale: 0.95 }} disabled={deletingId === service.id}
                        onClick={() => handleDeleteService(service)}
                        className="btn btn-danger btn-sm p-2" aria-label={`Delete ${service.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Sub-items expanded view */}
                <AnimatePresence>
                  {expandedService === service.id && (service.subItems?.length ?? 0) > 0 && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-line">
                      <div className="p-4 space-y-2 bg-surface-soft">
                        <p className="text-xs font-semibold text-ink-mute uppercase tracking-wide">Sub-services / Options</p>
                        {service.subItems!.map((sub: ServiceSubItem) => (
                          <div key={sub.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                            <div>
                              <span className="text-sm font-medium text-ink">{sub.name}</span>
                              {sub.description && <span className="ml-2 text-xs text-ink-mute">{sub.description}</span>}
                            </div>
                            <span className="text-sm font-bold text-brand">{sub.price}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
