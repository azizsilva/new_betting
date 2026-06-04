/**
 * SVG icon sprite — defines reusable symbols so any component can render an
 * icon with `<svg><use href="#icon-..." /></svg>`. Rendered once in the root
 * layout (hidden). Icons inherit `currentColor` so they tint with text color.
 */
export function IconSprite() {
  return (
    <svg width="0" height="0" className="hidden" aria-hidden focusable="false">
      <defs>
        <symbol id="icon-sport" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7l3.5 2.5-1.3 4.1h-4.4L8.5 9.5 12 7z" />
            <path d="M12 3v4M3.6 9.5h4.9M5 18l3.3-3M19 18l-3.3-3M20.4 9.5h-4.9M14.2 13.6L16 18M9.8 13.6L8 18" />
          </g>
        </symbol>

        <symbol id="icon-live" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M6 10v4h2M11 10v4M14.5 10v4h2.5M14.5 12h2" />
          </g>
        </symbol>

        <symbol id="icon-home" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 3.2 3.5 10v9.3c0 .8.6 1.4 1.4 1.4H9v-6h6v6h4.1c.8 0 1.4-.6 1.4-1.4V10L12 3.2z"
          />
        </symbol>

        <symbol id="icon-games" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="7" width="18" height="12" rx="3" />
            <path d="M7 11v3M5.5 12.5h3M14.5 12.5h.01M17 14h.01M16 11h.01" />
          </g>
        </symbol>

        <symbol id="icon-menu" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </g>
        </symbol>

        {/* ── Category nav icons (40×40 usage) ── */}
        {/* Soccer ball — circle + centered pentagon + 5 seams to the edge */}
        <symbol id="icon-sports" viewBox="0 0 32 32">
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <circle cx="16" cy="16" r="12" />
            <polygon points="16,11 20.2,14 18.6,19 13.4,19 11.8,14" fill="currentColor" stroke="none" />
            <path d="M16 4.2v6.8" />
            <path d="M27 12.2l-6.8 1.8" />
            <path d="M22.8 26.4 18.6 19" />
            <path d="M9.2 26.4 13.4 19" />
            <path d="M5 12.2l6.8 1.8" />
          </g>
        </symbol>

        {/* "LIVE" pill — rounded TV box with real LIVE text */}
        <symbol id="icon-live-sport" viewBox="0 0 32 32">
          <rect x="3.5" y="9" width="25" height="14" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <text x="16" y="16.2" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="800" letterSpacing="0.5" fill="currentColor" fontFamily="system-ui, sans-serif">LIVE</text>
        </symbol>

        {/* "CASINO" hexagon badge with real CASINO text */}
        <symbol id="icon-casino" viewBox="0 0 32 32">
          <path d="M16 4.5l10 5.7v11.6L16 27.5 6 21.8V10.2L16 4.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <text x="16" y="16.4" textAnchor="middle" dominantBaseline="central" fontSize="5" fontWeight="800" letterSpacing="0.3" fill="currentColor" fontFamily="system-ui, sans-serif">CASINO</text>
        </symbol>

        {/* Roulette wheel */}
        <symbol id="icon-live-casino-nav" viewBox="0 0 32 32">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
            <circle cx="16" cy="16" r="11.5" />
            <circle cx="16" cy="16" r="3" />
            <path d="M16 4.5v5M16 22.5v5M4.5 16h5M22.5 16h5M8 8l3.5 3.5M20.5 20.5 24 24M24 8l-3.5 3.5M11.5 20.5 8 24" />
          </g>
        </symbol>

        {/* Rocket */}
        <symbol id="icon-instant" viewBox="0 0 32 32">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.5 4.5c3.6.8 5.9 3.1 6.7 6.7-2.8 6.7-7.1 11-12 13.1l-2.4-2.4C13.8 17 18.1 12.7 19.5 4.5z" />
            <path d="M12.3 19.7 8.5 16c-1.9.7-3.2 2.1-3.9 4.5 2.4-.7 3.9.7 4.6 2.6.7 1.9 2.6.6 4.5-.1M19 12.9a1.9 1.9 0 100-3.8 1.9 1.9 0 000 3.8z" />
          </g>
        </symbol>

        <symbol id="icon-slots" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
            <path d="M7 8h10M7 8v8M12 8v8M17 8v8" />
            <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
          </g>
        </symbol>

        <symbol id="icon-jackpot" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 4h14l-1.5 5.5a5.5 5.5 0 01-11 0L5 4z" />
            <path d="M12 15v3M8.5 20.5h7M9.5 18h5" />
            <path d="M5 5H3.2a2 2 0 000 4H6M19 5h1.8a2 2 0 010 4H18" />
          </g>
        </symbol>

        {/* Gift box (promotions) */}
        <symbol id="icon-promotions" viewBox="0 0 32 32">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="12.5" width="22" height="5" rx="1.2" />
            <path d="M6.5 17.5v9a1.3 1.3 0 001.3 1.3h16.4a1.3 1.3 0 001.3-1.3v-9M16 12.5v15.3" />
            <path d="M16 12.5C12 12.5 9.3 11.2 9.3 8.9 9.3 7.2 10.6 6.1 12.2 6.1c2.6 0 3.8 3.2 3.8 6.4zM16 12.5c4 0 6.7-1.3 6.7-3.6 0-1.7-1.3-2.8-2.9-2.8-2.6 0-3.8 3.2-3.8 6.4z" />
            <path d="M22 6l2-1.3M24.5 10l2 .4" strokeWidth="1.3" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

/** Convenience wrapper to render a sprite icon by id. */
export function SpriteIcon({
  id,
  className,
  size = 24,
}: {
  id: string;
  className?: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} className={className} aria-hidden focusable="false">
      <use href={`#${id}`} />
    </svg>
  );
}
