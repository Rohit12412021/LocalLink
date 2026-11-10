import Link from "next/link";
import { MapPin } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  eyebrow?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  eyebrow,
}: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-10 sm:py-14">
      <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand to-brand-strong p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0, transparent 35%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0, transparent 40%)",
            }}
          />
          <div className="relative">
            <Link href="/" className="flex items-center gap-2.5 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <MapPin size={20} />
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                LocalLink
              </span>
            </Link>

            <h2 className="mt-14 max-w-sm text-3xl font-extrabold leading-tight tracking-tight">
              Trusted local pros,
              <br />
              booked in minutes.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
              Find verified mechanics, electricians, plumbers and more near you —
              or grow your own service business with bookings that come to you.
            </p>
          </div>

          <ul className="relative mt-10 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Real reviews from real neighbours
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Instant booking &amp; live status updates
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Save favourites and rebook in one tap
            </li>
          </ul>
        </div>

        {/* Form panel */}
        <div className="mx-auto w-full max-w-md self-center">
          <div className="mb-6 text-center lg:text-left">
            {eyebrow ? (
              <span className="badge badge-brand mb-3">{eyebrow}</span>
            ) : null}
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-ink-mute">{subtitle}</p>
            ) : null}
          </div>

          <div className="card p-6 sm:p-8">{children}</div>

          {footer ? (
            <div className="mt-6 text-center text-sm text-ink-mute">{footer}</div>
          ) : null}
        </div>
      </div>
    </main>
  );
}