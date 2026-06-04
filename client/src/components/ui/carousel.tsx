"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroll carousel (Embla) with optional arrow controls.
 * Children are rendered as slides; pass slide widths via `slideClassName`.
 */
export function Carousel({
  children,
  slideClassName,
  className,
}: {
  children: ReactNode[];
  slideClassName?: string;
  className?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {children.map((child, i) => (
            <div key={i} className={cn("min-w-0 shrink-0", slideClassName)}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows (desktop) */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        className={cn(
          "absolute -left-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg-elevated text-fg shadow-lg transition-opacity lg:grid",
          canPrev ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Previous"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        className={cn(
          "absolute -right-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg-elevated text-fg shadow-lg transition-opacity lg:grid",
          canNext ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Next"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
