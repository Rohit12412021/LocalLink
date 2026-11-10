"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  MapPin,
  Briefcase,
  Star,
  Shield,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
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
    name: "",
    about: "",
    phone: "",
    whatsapp: "",
    location: "",
    experience: "",
    available: true,
  });

  // Auth guard: redirect if not logged in or not a provider
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?returnUrl=/dashboard/profile");
      return;
    }
    if (user.role !== "Provider") {
      router.replace("/home");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user?.role === "Provider") {
      loadProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getMyProviderProfile();
      setProvider(data);
      setFormData({
        name: data.name,
        about: data.about || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        location: data.location,
        experience: data.experience || "",
        available: data.available,
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    try {
      setUploading(true);
      await uploadProfilePhoto(file);
      await loadProfile();
      toast.success("Profile photo updated successfully!");
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateMyProviderProfile(formData);
      await loadProfile();
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-600">No provider profile found.</p>
      </div>
    );
  }

  const completionPercentage = calculateProfileCompletion(provider);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Completion Banner */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Profile Completion</h2>
                <p className="text-teal-100">Complete your profile to get more bookings</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{completionPercentage}%</div>
                <div className="h-2 w-32 rounded-full bg-teal-800/50 mt-2">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Header */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Avatar Section */}
              <div className="relative">
                <div className="relative group">
                  {provider.avatarUrl ? (
                    <img
                      src={provider.avatarUrl}
                      alt={provider.name}
                      className="h-32 w-32 rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 text-4xl font-bold text-teal-700 shadow-lg">
                      {provider.name.charAt(0)}
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-8 w-8 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/90">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{provider.name}</h1>
                    <p className="mt-1 text-slate-600">{provider.category}</p>
                  </div>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    {editMode ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{provider.rating}</span>
                    <span className="text-slate-500">({provider.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    {provider.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    {provider.experience} experience
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {provider.available ? (
                    <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      Available Now
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                      <XCircle className="h-4 w-4" />
                      Currently Busy
                    </div>
                  )}
                  <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    <Shield className="h-4 w-4" />
                    Verified Provider
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            {editMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 border-t border-slate-200 pt-8"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Experience
                    </label>
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g., 5 years"
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="available" className="text-sm font-medium text-slate-700">
                      Available for new bookings
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      About
                    </label>
                    <textarea
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      rows={4}
                      placeholder="Tell customers about your services and experience..."
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white hover:bg-teal-700 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="rounded-lg border border-slate-200 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Profile Stats */}
            {!editMode && (
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{provider.reviewCount}</div>
                  <div className="text-sm text-slate-600">Reviews</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{provider.rating}</div>
                  <div className="text-sm text-slate-600">Rating</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{provider.services.length}</div>
                  <div className="text-sm text-slate-600">Services</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{provider.available ? "Active" : "Busy"}</div>
                  <div className="text-sm text-slate-600">Status</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-xl bg-white p-6 shadow-lg text-left hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Manage Services</h3>
                    <p className="text-sm text-slate-600">Add or edit your services</p>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href={`/provider/${provider?.id ?? ""}`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-xl bg-white p-6 shadow-lg text-left hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">View Reviews</h3>
                    <p className="text-sm text-slate-600">See what customers say</p>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/provider-requests">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-xl bg-white p-6 shadow-lg text-left hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Booking History</h3>
                    <p className="text-sm text-slate-600">View past bookings</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
    </div>
  );
}

function calculateProfileCompletion(provider: Provider): number {
  let completed = 0;
  const total = 6;

  if (provider.name) completed++;
  if (provider.about) completed++;
  if (provider.phone) completed++;
  if (provider.location) completed++;
  if (provider.experience) completed++;
  if (provider.avatarUrl) completed++;

  return Math.round((completed / total) * 100);
}
