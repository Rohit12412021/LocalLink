"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, CalendarCheck, Compass, Heart,
  Home, LayoutDashboard, LogIn, LogOut, MapPin,
  Menu, MessageSquare, Moon, Sun, UserCircle2, X,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

const NAV_LINKS = [
  { href: "/home",             label: "Home",            icon: Home },
  { href: "/search",           label: "Explore",         icon: Compass },
  { href: "/requests",         label: "My Bookings",     icon: CalendarCheck },
  { href: "/chat",             label: "Messages",        icon: MessageSquare },
  { href: "/provider-requests",label: "Inbox",           icon: MessageSquare, providerOnly: true },
  { href: "/dashboard",        label: "Dashboard",       icon: LayoutDashboard, providerOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unread, notifications, markAllRead } = useNotifications();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Hide navbar on landing page — it has its own navigation
  const isLanding = pathname === "/";
  const isProvider = user?.role === "Provider";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (isLanding) return null;

  const visibleLinks = NAV_LINKS.filter(l => !l.providerOnly || isProvider);

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b bg-canvas/90 backdrop-blur-xl transition-all duration-300",
      scrolled ? "border-line shadow-[var(--shadow-card)]" : "border-transparent",
    )}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">

        {/* Logo */}
        <Link href={user ? "/home" : "/"} className="group flex shrink-0 items-center gap-2.5">
          <motion.span
            whileHover={{ rotate: -10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-blue-500 text-white shadow-[var(--shadow-glow)]"
          >
            <MapPin size={18} />
          </motion.span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Local<span className="text-brand">Link</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {visibleLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200",
                  active
                    ? "text-brand"
                    : "text-ink-mute hover:bg-surface-soft hover:text-ink",
                )}
              >
                <Icon size={15} className={active ? "text-brand" : ""} />
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl bg-brand/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">

          {/* Theme toggle */}
          <motion.button
            type="button"
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition-colors hover:border-brand hover:text-brand"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 30, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {!loading && user && (
            <Link href="/favorites" aria-label="Favourites"
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition-colors hover:border-accent hover:text-accent sm:flex"
            >
              <Heart size={17} />
            </Link>
          )}

          {!loading && user ? (
            <>
              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <motion.button
                  type="button"
                  onClick={() => setNotifOpen(v => !v)}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition-colors hover:border-brand hover:text-brand"
                >
                  <Bell size={17} />
                  <AnimatePresence>
                    {unread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500 }}
                        className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white"
                      >
                        {unread > 9 ? "9+" : unread}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, type: "spring", stiffness: 400 }}
                      className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-pop)]"
                    >
                      <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <h3 className="text-sm font-bold text-ink">Notifications</h3>
                        {unread > 0 && (
                          <button type="button" onClick={markAllRead} className="text-xs font-semibold text-brand hover:underline">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                            <BellOff size={22} className="text-ink-faint" />
                            <p className="text-sm text-ink-mute">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n, i) => (
                            <motion.div
                              key={n.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className={cn("border-b border-line px-4 py-3 last:border-0", !n.read && "bg-brand-soft/40")}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-ink">{n.title}</p>
                                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                              </div>
                              {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-ink-mute">{n.body}</p>}
                              <p className="mt-1 text-[10px] text-ink-faint">{new Date(n.createdAt).toLocaleString()}</p>
                            </motion.div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-line px-4 py-2">
                        <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-semibold text-brand hover:underline">
                          View all notifications →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile menu */}
              <div ref={profileRef} className="relative">
                <motion.button
                  type="button"
                  onClick={() => setProfileOpen(v => !v)}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Account menu"
                  className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1 pr-2.5 transition-all hover:border-brand"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                  <span className="hidden max-w-24 truncate text-sm font-semibold text-ink sm:block">
                    {user.name.split(" ")[0]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, type: "spring", stiffness: 400 }}
                      className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-[var(--shadow-pop)]"
                    >
                      <div className="border-b border-line px-4 py-3">
                        <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                        <p className="truncate text-xs text-ink-mute">{user.email}</p>
                      </div>
                      {[
                        { href: "/profile", icon: UserCircle2, label: "My Profile" },
                        ...(isProvider ? [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }] : []),
                        { href: "/favorites", icon: Heart, label: "Saved Providers" },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
                        >
                          <Icon size={15} className="text-brand" />
                          {label}
                        </Link>
                      ))}
                      <div className="mt-1 border-t border-line pt-1">
                        <button type="button" onClick={() => { setProfileOpen(false); logout(); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : !loading ? (
            <Link href="/login" className="btn btn-brand btn-sm">
              <LogIn size={15} /> Sign in
            </Link>
          ) : null}

          {/* Mobile hamburger */}
          <motion.button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            whileTap={{ scale: 0.9 }}
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={menuOpen ? "x" : "menu"} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.15 }}>
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-line bg-canvas"
          >
            <div className="px-4 pb-5 pt-2 space-y-1">
              {visibleLinks.map(({ href, label, icon: Icon }, i) => {
                const active = isActive(href);
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={href} onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                        active ? "bg-brand/10 text-brand" : "text-ink hover:bg-surface-soft",
                      )}
                    >
                      <Icon size={17} className={active ? "text-brand" : "text-ink-mute"} />
                      {label}
                      {active && <span className="ml-auto h-2 w-2 rounded-full bg-brand" />}
                    </Link>
                  </motion.div>
                );
              })}
              {!loading && user ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <button type="button" onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-danger hover:bg-danger-soft"
                  >
                    <LogOut size={17} /> Sign out
                  </button>
                </motion.div>
              ) : !loading ? (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn btn-brand mt-2 w-full">
                  <LogIn size={15} /> Sign in
                </Link>
              ) : null}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
