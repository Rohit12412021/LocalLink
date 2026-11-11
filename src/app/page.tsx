"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, Wrench, Zap, Hammer, Droplets, Paintbrush, Sofa,
  MapPin, Shield, Clock, Star, CheckCircle, Users, Sparkles, ChevronDown,
} from "lucide-react";

const CATEGORIES = [
  { icon: Wrench,      label: "Mechanic",    color: "from-blue-500 to-blue-600",    bg: "bg-blue-500/10",   delay: 0 },
  { icon: Zap,         label: "Electrician", color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10",  delay: 60 },
  { icon: Droplets,    label: "Plumber",     color: "from-cyan-500 to-teal-500",    bg: "bg-cyan-500/10",   delay: 120 },
  { icon: Hammer,      label: "Carpenter",   color: "from-orange-500 to-red-500",   bg: "bg-orange-500/10", delay: 180 },
  { icon: Paintbrush,  label: "Painter",     color: "from-pink-500 to-rose-500",    bg: "bg-pink-500/10",   delay: 240 },
  { icon: Sofa,        label: "Cleaning",    color: "from-green-500 to-emerald-500",bg: "bg-green-500/10",  delay: 300 },
];

const STATS = [
  { value: "500+", label: "Verified Providers" },
  { value: "10k+", label: "Bookings Done" },
  { value: "4.8★", label: "Average Rating" },
  { value: "24/7", label: "Support Available" },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Verified Providers",
    desc: "Every provider is background-checked and verified before listing.",
    color: "from-brand to-blue-400",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    desc: "Track your request status live with instant push notifications.",
    color: "from-amber-500 to-orange-400",
  },
  {
    icon: Star,
    title: "Honest Reviews",
    desc: "Genuine ratings from real customers — no fake reviews, ever.",
    color: "from-pink-500 to-rose-400",
  },
  {
    icon: Users,
    title: "In-App Chat",
    desc: "Talk directly to your provider without sharing your number.",
    color: "from-green-500 to-emerald-400",
  },
];

const HOW = [
  { step: "01", title: "Find a Provider", desc: "Search by category or location and browse verified professionals near you." },
  { step: "02", title: "Request a Service", desc: "Pick a service, choose your date and time, describe your problem." },
  { step: "03", title: "Chat & Confirm", desc: "Provider accepts and chats with you. Track everything in real time." },
  { step: "04", title: "Done & Review", desc: "Service completed? Pay in-app and leave a review to help others." },
];

export default function Page() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <main className="overflow-hidden bg-canvas">

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-24">
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-brand/20 blur-[120px] animate-blob" />
          <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-accent/15 blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-brand/10 blur-[80px] animate-blob animation-delay-4000" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:"linear-gradient(var(--ink) 1px,transparent 1px),linear-gradient(90deg,var(--ink) 1px,transparent 1px)",backgroundSize:"60px 60px"}} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto max-w-4xl text-center">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand backdrop-blur-sm"
          >
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Sparkles size={14} />
            </motion.span>
            India&apos;s smartest local service marketplace
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, type: "spring", damping: 20 }}
            className="text-5xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl md:text-7xl"
          >
            Find Local Services
            <br />
            <span className="relative inline-block">
              <span className="animate-gradient-x bg-gradient-to-r from-brand via-purple-500 to-accent bg-clip-text text-transparent">
                In Minutes
              </span>
              {/* Underline accent */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -bottom-2 left-0 h-1 w-full origin-left rounded-full bg-gradient-to-r from-brand to-accent"
              />
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-mute"
          >
            Connect with verified mechanics, plumbers, electricians and more near you.
            Book instantly, chat securely, track in real-time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/home" className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-blue-500 px-8 py-4 text-base font-bold text-white shadow-[0_8px_32px_-8px_rgba(26,115,232,0.6)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_-8px_rgba(26,115,232,0.8)] animate-pulse-glow">
              <span className="relative z-10 flex items-center gap-2">
                Find a Service
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Link>
            <Link href="/register?role=Provider" className="group flex items-center gap-2 rounded-2xl border border-line bg-surface/50 px-8 py-4 text-base font-bold text-ink backdrop-blur-sm transition-all duration-300 hover:border-brand hover:text-brand hover:scale-105">
              Become a Provider
              <ArrowRight size={18} className="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08, type: "spring" }}
                className="flex flex-col items-center gap-1 rounded-2xl border border-line/50 bg-surface/50 p-4 backdrop-blur-sm"
              >
                <span className="text-2xl font-extrabold text-ink">{s.value}</span>
                <span className="text-xs font-medium text-ink-mute">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown size={24} className="text-ink-faint" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="badge badge-brand mb-4 text-xs uppercase tracking-widest">Services</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-ink">What do you need?</h2>
            <p className="mt-3 text-ink-mute">Browse by category and find the right professional</p>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map(({ icon: Icon, label, color, bg, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: delay / 1000, type: "spring", damping: 18 }}
                whileHover={{ y: -8, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link href={`/search?category=${encodeURIComponent(label)}`} className={`flex flex-col items-center gap-3 rounded-2xl border border-line/50 ${bg} p-5 text-center transition-all duration-300 hover:border-brand/40 hover:shadow-[0_8px_30px_-8px_rgba(26,115,232,0.2)] shimmer-overlay`}>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-sm font-bold text-ink">{label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <Link href="/search" className="btn btn-outline">
              View all categories <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-brand/10 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
            <span className="badge badge-accent mb-4 text-xs uppercase tracking-widest">How it works</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-ink">Book in 4 simple steps</h2>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, type: "spring", damping: 18 }}
                className="relative"
              >
                {/* Connector line */}
                {i < 3 && <div className="absolute left-full top-8 z-10 hidden h-0.5 w-6 bg-gradient-to-r from-line to-transparent lg:block" />}
                <div className="card p-6 hover:border-brand/40 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-xl font-extrabold text-brand">
                    {step}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mute">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
            <span className="badge badge-brand mb-4 text-xs uppercase tracking-widest">Why LocalLink</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-ink">Built for trust &amp; speed</h2>
            <p className="mt-3 text-ink-mute">Everything you need, nothing you don&apos;t</p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, type: "spring" }}
                whileHover={{ y: -6 }}
                className="card group p-6 transition-all duration-300 hover:border-brand/30 hover:shadow-[var(--shadow-pop)]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-blue-500 p-10 text-center text-white shadow-[0_20px_60px_-15px_rgba(26,115,232,0.5)]"
          >
            {/* Background shimmer */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-none" style={{ animation: "shimmer-move 3s ease-in-out infinite" }} />
            <div className="relative z-10">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <CheckCircle size={48} className="mx-auto mb-4 text-white/80" />
              </motion.div>
              <h2 className="text-3xl font-extrabold">Ready to get started?</h2>
              <p className="mt-3 text-lg text-white/80">Join thousands of happy customers using LocalLink every day.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register" className="group flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  Create free account
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link href="/home" className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  Browse services
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-line px-4 py-10 text-center">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-blue-500 text-white">
              <MapPin size={16} />
            </span>
            <span className="text-base font-extrabold text-ink">Local<span className="text-brand">Link</span></span>
          </Link>
          <p className="mt-4 text-sm text-ink-faint">© 2026 LocalLink. Find trusted local services near you.</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-ink-mute">
            <Link href="/home" className="hover:text-brand transition-colors">Browse</Link>
            <Link href="/register" className="hover:text-brand transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-brand transition-colors">Login</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
