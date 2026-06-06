import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FaTelegram, FaInstagram, FaEnvelope } from "react-icons/fa6";
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
              <FaTelegram className="size-4" />
            </a>
            <a
              href="https://www.instagram.com/afrobet216"
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-9 place-items-center rounded-lg border border-line text-fg hover:border-gold/50 hover:text-gold"
              aria-label="Instagram"
            >
              <FaInstagram className="size-4" />
            </a>
            <a
              href="mailto:Afrobet216@gmail.com"
              className="grid size-9 place-items-center rounded-lg border border-line text-fg hover:border-gold/50 hover:text-gold"
              aria-label="Email"
            >
              <FaEnvelope className="size-4" />
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
