import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

// Wide hero promo + two narrow ones, matching the source image aspect ratios.
const PROMOS = [
  { src: "/images/promotion-0.webp", alt: "250% welcome sports bonus", href: "/promotions", wide: true, w: 1757, h: 825 },
  { src: "/images/promotion-1.webp", alt: "10% daily cashback", href: "/promotions", wide: false, w: 855, h: 825 },
  { src: "/images/promotion-2.webp", alt: "Friday 100% sports bonus", href: "/promotions", wide: false, w: 855, h: 825 },
];

export function Promotions() {
  return (
    <Section>
      <SectionHeader
        icon={<Crown className="size-5 text-gold" />}
        title="Promotions"
        actionLabel="View all"
        actionHref="/promotions"
      />
      {/* Wide hero card ~46%, two narrow cards ~27% each — matching kingsbet365. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[1.7fr_1fr_1fr]">
        {PROMOS.map((p) => (
          <Link
            key={p.src}
            href={p.href}
            className={`group relative block overflow-hidden rounded-2xl border border-line ${
              p.wide ? "sm:col-span-2 md:col-span-1" : ""
            }`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              width={p.w}
              height={p.h}
              sizes={p.wide ? "(max-width: 768px) 100vw, 46vw" : "(max-width: 768px) 50vw, 27vw"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}
