import Link from "next/link";
import { ArrowLeft, CalendarCheck, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

import ProviderHeader from "@/components/provider/provider-header";
import ProviderAbout from "@/components/provider/provider-about";
import ProviderServices from "@/components/provider/provider-services";
import ProviderGallery from "@/components/provider/provider-gallery";
import ProviderReviews from "@/components/provider/provider-reviews";
import { getApiBaseUrl } from "@/lib/api";
import type { Provider } from "@/types";

type Props = { params: Promise<{ id: string }> };

async function fetchProvider(id: string): Promise<Provider | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/providers/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as Provider;
  } catch {
    return null;
  }
}

export default async function ProviderPage({ params }: Props) {
  const { id } = await params;
  const provider = await fetchProvider(id);

  if (!provider) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-canvas px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Provider not found</h1>
          <p className="mt-2 text-sm text-ink-mute">This provider could not be loaded.</p>
          <Link href="/search" className="btn btn-brand mt-5">Browse providers</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas pb-36">
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Back */}
        <Link href="/search" aria-label="Back to search"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-mute transition-all hover:border-brand hover:text-brand hover:-translate-x-0.5"
        >
          <ArrowLeft size={16} /> Back to search
        </Link>

        <div className="mt-6 space-y-5">
          <ProviderHeader
            id={provider.id}
            name={provider.name}
            category={provider.category}
            rating={provider.rating}
            reviewCount={provider.reviewCount}
            distance={provider.distance}
            available={provider.available}
            location={provider.location}
            experience={provider.experience}
            avatarUrl={provider.avatarUrl}
          />
          <ProviderAbout about={provider.about} />
          <ProviderGallery images={provider.gallery ?? []} />
          <ProviderServices services={provider.services} />
          <ProviderReviews providerId={provider.id} />
        </div>
      </div>

      {/* Sticky action bar — Chat + Request only (no WhatsApp/direct call) */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl gap-3 px-4 py-3.5">

          {/* In-app chat — only available after requesting service */}
          <div className="group relative flex-1">
            <Link
              href={`/request-service?provider=${provider.id}`}
              className="btn btn-outline flex w-full items-center justify-center gap-2"
            >
              <MessageSquare size={17} />
              Message
            </Link>
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs font-medium text-canvas opacity-0 transition-opacity group-hover:opacity-100">
              Chat starts after you request a service
            </div>
          </div>

          <Link
            href={`/request-service?provider=${provider.id}`}
            className="btn btn-brand flex-[2] text-sm"
          >
            <CalendarCheck size={17} />
            Request Service
          </Link>
        </div>
      </div>
    </main>
  );
}
