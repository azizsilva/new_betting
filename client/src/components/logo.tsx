import Link from "next/link";
import { cn } from "@/lib/utils";

// BetSlate brand logo.
export function Logo({
  size = 40,
  href = "/",
  className,
}: {
  size?: number;
  href?: string | null;
  className?: string;
}) {
  const logo = (
    <img
      src="/images/logo_2_afroo-removebg-preview.png"
      alt="BetSlate"
      style={{ height: size }}
      className={cn("w-auto object-contain", className)}
    />
  );
  
  if (href === null) return logo;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Home">
      {logo}
    </Link>
  );
}
