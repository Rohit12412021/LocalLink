type ProviderAboutProps = {
  about: string;
};

export default function ProviderAbout({ about }: ProviderAboutProps) {
  if (!about) return null;
  return (
    <section className="card p-6">
      <h2 className="section-title">About</h2>
      <p className="mt-4 leading-7 text-ink-mute">{about}</p>
    </section>
  );
}