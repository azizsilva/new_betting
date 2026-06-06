import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

const ACTIVITIES = [
  { label: "Promotions", href: "/promotions" },
  { label: "Hall of Fame", href: "#" },
  { label: "High Rollers", href: "#" },
];
const LEGAL = [
  { label: "Security", href: "#" },
  { label: "Cookies", href: "#" },
  { label: "About Us", href: "#" },
  { label: "Affiliate", href: "#" },
];

// Inline SVG icons — no external icon library needed (avoids react-icons/fa6 dep)
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0zm5.992 8.17-2.017 9.5c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.537-.194 1.006.131.88.72z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-bg-elevated">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <Logo size={64} className="h-16 w-auto" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            The administration of &ldquo;AfroBet216&rdquo; undertakes to provide a service —
            accepting a bet on a sporting result. The user undertakes to pay by crediting funds to
            the gaming account. All rights reserved and protected by law.
          </p>
          <p className="mt-3 text-sm text-muted">© 2020–{new Date().getFullYear()} AfroBet216</p>
          <div className="mt-4 flex gap-2">
            <a
              href="https://t.me/Afrobet216"
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-9 place-items-center rounded-lg border border-line text-fg hover:border-gold/50 hover:text-gold"
              aria-label="Telegram"
            >
              <TelegramIcon className="size-4" />
            </a>
            <a
              href="https://www.instagram.com/afrobet216"
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-9 place-items-center rounded-lg border border-line text-fg hover:border-gold/50 hover:text-gold"
              aria-label="Instagram"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href="mailto:Afrobet216@gmail.com"
              className="grid size-9 place-items-center rounded-lg border border-line text-fg hover:border-gold/50 hover:text-gold"
              aria-label="Email"
            >
              <EnvelopeIcon className="size-4" />
            </a>
          </div>
        </div>

        {/* Activities */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Activities</h4>
          <ul className="space-y-2.5">
            {ACTIVITIES.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-medium hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Legal</h4>
          <ul className="space-y-2.5">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-medium hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer + trust badges */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-4 px-4 py-5 text-xs text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl leading-relaxed">
            Notice: This is gambling-related advertising. Gambling will not solve your financial
            problems. Always read the terms and conditions and play responsibly.
          </p>
          <div className="flex items-center gap-4 opacity-70">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4" /> SSL Secure
            </span>
            <span>Responsible Gaming</span>
            <span className="grid size-8 place-items-center rounded-full border border-line">18+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
