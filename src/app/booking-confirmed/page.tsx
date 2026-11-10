"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarCheck, CheckCircle2, Home, Search, MessageSquare } from "lucide-react";

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="card p-8 text-center"
        >
          {/* Animated check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.25 }}
            >
              <CheckCircle2 size={40} className="text-success" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-2xl font-extrabold tracking-tight text-ink"
          >
            Booking confirmed!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="mt-2 text-sm text-ink-mute"
          >
            Your service request has been submitted. The provider will respond shortly.
          </motion.p>

          {requestId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44 }}
              className="mt-4 rounded-xl bg-surface-soft px-4 py-3 text-sm text-ink-mute"
            >
              Request ID: <span className="font-bold text-ink">{requestId}</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 space-y-3"
          >
            {requestId ? (
              <>
                <Link href={`/request/${requestId}`} className="btn btn-brand btn-block">
                  <CalendarCheck size={17} /> View booking details
                </Link>
                <Link href={`/request/${requestId}`} className="btn btn-outline btn-block">
                  <MessageSquare size={17} /> Chat with provider
                </Link>
              </>
            ) : (
              <Link href="/requests" className="btn btn-brand btn-block">
                <CalendarCheck size={17} /> View my bookings
              </Link>
            )}
            <Link href="/search" className="btn btn-ghost btn-block">
              <Search size={17} /> Find another service
            </Link>
            <Link href="/home" className="btn btn-ghost btn-block">
              <Home size={17} /> Back to home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={<main className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><div className="skeleton h-64 w-full max-w-lg" /></main>}>
      <BookingConfirmedContent />
    </Suspense>
  );
}
