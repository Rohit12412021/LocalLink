"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera, MapPin, Briefcase, Star, Shield, Award,
  Clock, CheckCircle, XCircle, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getMyProviderProfile, updateMyProviderProfile, uploadProfilePhoto } from "@/lib/api";
import { toast } from "sonner";
import type { Provider } from "@/types";

export default function ProviderProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "", about: "", phone: "", whatsapp: "",
    location: "", experience: "", available: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?returnUrl=/dashboard/profile"); return; }
    if (user.role !== "Provider") { router.replace("/home"); }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user?.role === "Provider") loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getMyProviderProfile();
      setProvider(data);
      setFormData({
        name: data.name, about: data.about || "", phone: data.phone || "",
        whatsapp: data.whatsapp || "", location: data.location,
        experience: data.experience || "", available: data.available,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File size must be less than 5MB"); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed"); return;
    }
    try {
      setUploading(true);
      await uploadProfilePhoto(file);
      await loadProfile();
      toast.success("Profile photo updated!");
    } catch { toast.error("Failed to upload photo."); }
    finally { setUploading(false); }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateMyProviderProfile(formData);
      await loadProfile();
      setEditMode(false);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile."); }
    finally { setSaving(false); }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
          <p className="mt-4 text-ink-mute">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-mute">No provider profile found.</p>
      </div>
    );
  }

  const pct = calculateCompletion(provider);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

      {/* Completion banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand to-blue-500 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Profile Completion</h2>
            <p className="text-white/70 text-sm mt-0.5">Complete your profile to get more bookings</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold">{pct}%</div>
            <div className="h-2 w-32 rounded-full bg-white/20 mt-2">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="relative group">
              {provider.avatarUrl ? (
                <img src={provider.avatarUrl} alt={provider.name} className="h-32 w-32 rounded-2xl object-cover shadow-lg" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-brand-soft text-4xl font-bold text-brand shadow-lg">
                  {provider.name.charAt(0)}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-8 w-8 text-white" />
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/90">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-ink">{provider.name}</h1>
                <p className="mt-1 text-ink-mute">{provider.category}</p>
              </div>
              <button onClick={() => setEditMode(!editMode)} className="btn btn-outline btn-sm">
                {editMode ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-ink-mute">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-ink">{provider.rating}</span>
                <span>({provider.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-mute">
                <MapPin className="h-4 w-4 text-brand" /> {provider.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-mute">
                <Briefcase className="h-4 w-4 text-ink-faint" /> {provider.experience} experience
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {provider.available ? (
                <span className="badge badge-success"><CheckCircle className="h-3.5 w-3.5" /> Available Now</span>
              ) : (
                <span className="badge badge-danger"><XCircle className="h-3.5 w-3.5" /> Currently Busy</span>
              )}
              <span className="badge badge-info"><Shield className="h-3.5 w-3.5" /> Verified</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        {editMode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 border-t border-line pt-8">
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { label: "Business Name", key: "name", type: "text" },
                { label: "Phone Number", key: "phone", type: "tel" },
                { label: "WhatsApp Number", key: "whatsapp", type: "tel" },
                { label: "Location", key: "location", type: "text" },
                { label: "Experience", key: "experience", type: "text", placeholder: "e.g., 5 years" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type={type} value={formData[key as keyof typeof formData] as string}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder} className="input" />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="available" checked={formData.available}
                  onChange={e => setFormData({ ...formData, available: e.target.checked })}
                  className="h-5 w-5 rounded border-line text-brand" />
                <label htmlFor="available" className="text-sm font-medium text-ink">Available for new bookings</label>
              </div>
              <div className="md:col-span-2">
                <label className="label">About</label>
                <textarea value={formData.about}
                  onChange={e => setFormData({ ...formData, about: e.target.value })}
                  rows={4} placeholder="Tell customers about your services..." className="input resize-none" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn btn-brand">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle className="h-4 w-4" /> Save Changes</>}
              </button>
              <button onClick={() => setEditMode(false)} className="btn btn-outline">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        {!editMode && (
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { value: provider.reviewCount, label: "Reviews" },
              { value: provider.rating, label: "Rating" },
              { value: provider.services.length, label: "Services" },
              { value: provider.available ? "Active" : "Busy", label: "Status" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl bg-surface-soft p-4 text-center border border-line">
                <div className="text-2xl font-bold text-ink">{value}</div>
                <div className="text-sm text-ink-mute">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/dashboard", icon: Briefcase, label: "Manage Services", sub: "Add or edit your services", bg: "bg-brand-soft", ic: "text-brand" },
          { href: `/provider/${provider.id}`, icon: Award, label: "View Reviews", sub: "See what customers say", bg: "bg-success-soft", ic: "text-success" },
          { href: "/provider-requests", icon: Clock, label: "Booking History", sub: "View past bookings", bg: "bg-info-soft", ic: "text-info" },
        ].map(({ href, icon: Icon, label, sub, bg, ic }) => (
          <Link key={href} href={href}>
            <motion.div whileHover={{ scale: 1.02 }} className="card p-6 cursor-pointer hover:border-brand/40 transition-all">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${ic}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{label}</h3>
                  <p className="text-sm text-ink-mute">{sub}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function calculateCompletion(p: Provider): number {
  const fields = [p.name, p.about, p.phone, p.location, p.experience, p.avatarUrl];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}
