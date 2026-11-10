import Image from "next/image";

export default function ProviderGallery({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;
  return (
    <section className="card p-6">
      <h2 className="section-title">Work gallery</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative aspect-square overflow-hidden rounded-xl border border-line"
          >
            <Image
              src={src}
              alt={`Gallery image ${i + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </section>
  );
}