import Link from "next/link";
import { cn } from "@/lib/utils";

// AfroBet216 brand logo.
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
      src="/images/logo.png"
      alt="Logo"
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
