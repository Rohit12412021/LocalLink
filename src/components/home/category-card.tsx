import Link from "next/link";

type CategoryCardProps = {
  name: string;
  description: string;
  icon: React.ElementType;
};

export default function CategoryCard({
  name,
  description,
  icon: Icon,
}: CategoryCardProps) {
  return (
    <Link
      href={`/search?category=${name.toLowerCase().replace(/\s+/g, "-")}`}
      className="card card-hover group block p-5 text-left"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 font-bold text-ink">{name}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-mute">{description}</p>
    </Link>
  );
}