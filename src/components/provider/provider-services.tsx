type Service = {
  name: string;
  price: string;
  description?: string;
};

type ProviderServicesProps = {
  services: Service[];
};

export default function ProviderServices({
  services,
}: ProviderServicesProps) {
  if (!services.length) return null;
  return (
    <section className="card p-6">
      <h2 className="section-title">Services &amp; pricing</h2>

      <div className="mt-4 divide-y divide-line">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="min-w-0">
              <h3 className="font-semibold text-ink">{service.name}</h3>
              {service.description ? (
                <p className="mt-0.5 text-sm text-ink-mute">
                  {service.description}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-base font-extrabold text-brand">
              {service.price}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}