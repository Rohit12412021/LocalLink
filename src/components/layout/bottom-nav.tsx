"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass, CalendarCheck, MessageSquare, UserCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home",     label: "Home",     icon: Home },
  { href: "/search",   label: "Explore",  icon: Compass },
  { href: "/requests", label: "Bookings", icon: CalendarCheck },
  { href: "/chat",     label: "Messages", icon: MessageSquare },
  { href: "/profile",  label: "Profile",  icon: UserCircle2 },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { unread } = useNotifications();

  // Only show for logged-in users, not on landing or auth pages
  const hideOn = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone", "/auth/callback"];
  if (!user || loading || hideOn.some(p => pathname === p)) return null;

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  }

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-canvas/95 backdrop-blur-xl pb-safe lg:hidden"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showBadge = href === "/chat" && unread > 0;

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-1 py-1 transition-opacity active:opacity-70"
            >
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="bottom-nav-blob"
                    className="absolute inset-0 -m-2 rounded-2xl bg-brand/15"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={active ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="relative z-10"
                >
                  <Icon
                    size={22}
                    className={cn(
                      "transition-colors duration-200",
                      active ? "text-brand" : "text-ink-faint",
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </motion.div>

                {/* Notification dot */}
                <AnimatePresence>
                  {showBadge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500 }}
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-white"
                    >
                      {unread > 9 ? "9+" : unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <span className={cn(
                "text-[10px] font-semibold transition-colors duration-200",
                active ? "text-brand" : "text-ink-faint",
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
