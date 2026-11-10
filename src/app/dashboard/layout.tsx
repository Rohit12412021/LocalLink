"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle, Settings, ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Provider Profile", icon: UserCircle, exact: false },
  { href: "/dashboard/settings", label: "Account Settings", icon: Settings, exact: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top bar */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link
            href="/home"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-slate-50 transition"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-lg font-bold text-ink">Dashboard</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-56">
            <nav className="flex flex-row gap-1 lg:flex-col" aria-label="Dashboard navigation">
              {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-brand text-white shadow-sm"
                        : "text-ink-mute hover:bg-surface hover:text-ink"
                    }`}
                  >
                    <Icon size={17} />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Page content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
