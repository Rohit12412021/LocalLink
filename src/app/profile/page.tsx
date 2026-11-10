"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, MapPin,
  CalendarCheck, LogOut, LayoutDashboard, LogIn, Settings, Pencil,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-ink-mute">Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="card p-10">
            <LogIn className="mx-auto h-10 w-10 text-brand" />
            <h1 className="mt-4 text-xl font-bold text-ink">Sign in to view profile</h1>
            <p className="mt-2 text-sm text-ink-mute">Create an account or sign in to manage your LocalLink profile.</p>
            <Link href="/login?returnUrl=/profile" className="btn btn-brand mt-6 inline-block">Sign in</Link>
          </div>
        </div>
      </main>
    );
  }

  const roleLabel = user.role === "Provider" ? "LocalLink Provider" : "LocalLink Customer";

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface hover:bg-surface-soft">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">Profile</h1>
            <p className="text-sm text-ink-mute">Your account information</p>
          </div>
        </div>

        {/* Avatar + name */}
        <section className="card mt-8 p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-line shadow">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-soft text-3xl font-bold text-brand">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-ink">{user.name}</h2>
              <p className="mt-0.5 text-sm text-ink-mute">{roleLabel}</p>
              <p className="mt-0.5 text-sm text-ink-mute">{user.email}</p>
            </div>
            <Link href="/dashboard/settings"
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-soft hover:border-brand hover:text-brand transition">
              <Pencil size={15} /> Edit Profile
            </Link>
          </div>
        </section>

        {/* Personal info */}
        <section className="card mt-5 p-6">
          <h2 className="text-base font-bold text-ink">Personal Information</h2>
          <div className="mt-5 space-y-5">
            {[
              { icon: User, label: "Full Name", value: user.name },
              { icon: Mail, label: "Email", value: user.email },
              { icon: Phone, label: "Phone", value: user.phone || "Not provided" },
              { icon: MapPin, label: "Location", value: user.location || "Not provided" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-ink-mute">{label}</p>
                  <p className="mt-0.5 font-medium text-ink">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="card mt-5 p-6">
          <h2 className="text-base font-bold text-ink">Quick Actions</h2>
          <div className="mt-5 space-y-3">
            {[
              { href: "/requests", icon: CalendarCheck, iconBg: "bg-brand-soft", iconColor: "text-brand", title: "My Bookings", sub: "View your service requests" },
              { href: "/dashboard/settings", icon: Settings, iconBg: "bg-surface-soft", iconColor: "text-ink-mute", title: "Account Settings", sub: "Update name, phone, and location" },
              ...(user.role === "Provider" ? [
                { href: "/dashboard", icon: LayoutDashboard, iconBg: "bg-warning-soft", iconColor: "text-warning", title: "Dashboard", sub: "Manage services and availability" },
                { href: "/provider-requests", icon: CalendarCheck, iconBg: "bg-brand-soft", iconColor: "text-brand", title: "Provider Inbox", sub: "Accept, reject, or complete requests" },
              ] : []),
            ].map(({ href, icon: Icon, iconBg, iconColor, title, sub }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between rounded-xl border border-line p-4 hover:bg-surface-soft transition">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="font-medium text-ink">{title}</p>
                    <p className="text-sm text-ink-mute">{sub}</p>
                  </div>
                </div>
                <span className="text-ink-faint">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Logout */}
        <section className="mt-5">
          <button type="button" onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-surface py-3.5 font-semibold text-danger hover:bg-danger-soft transition">
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </section>
      </div>
    </main>
  );
}
