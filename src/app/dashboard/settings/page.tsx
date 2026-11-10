"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Save, User, MapPin, Phone } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { FormMessage } from "@/components/ui/form-message";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateMe, uploadAvatar } = useAuth();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form fields whenever user loads or changes (handles async bootstrap)
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setLocation(user.location ?? "");
    }
  }, [user]);

  // Redirect unauthenticated users after auth has finished loading
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?returnUrl=/dashboard/settings");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink-mute">Loading...</p>
      </div>
    );
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await uploadAvatar(file);
      setMessage({ text: "Profile photo updated successfully!", type: "success" });
    } catch {
      setMessage({ text: "Failed to upload photo.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await updateMe({ name, phone, location });
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch {
      setMessage({ text: "Failed to update profile.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Account Settings</h1>
        <p className="text-ink-mute mt-1">Manage your profile and preferences.</p>
      </div>

      {message.text && (
        <FormMessage variant={message.type as "error" | "success"}>
          {message.text}
        </FormMessage>
      )}

      <div className="card p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-surface shadow-pop cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-brand-soft flex items-center justify-center text-brand-strong text-4xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={28} />
              </div>
            </div>
            <button
              onClick={handleAvatarClick}
              disabled={loading}
              className="text-sm font-semibold text-brand hover:underline"
            >
              Change Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <form onSubmit={handleSaveProfile} className="flex-1 space-y-5 w-full">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-line">
              <button type="submit" disabled={loading} className="btn btn-brand w-full sm:w-auto">
                <Save size={18} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
