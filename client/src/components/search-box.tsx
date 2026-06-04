"use client";

import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * URL-backed search. The committed term lives in the `?q=` query string
 * (shareable, survives refresh & back/forward). We keep a local input value
 * and debounce writes to the URL so typing stays snappy.
 */
export function SearchBox({
  placeholder = "Search events…",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useQueryState("q", { defaultValue: "", clearOnDefault: true });
  const [value, setValue] = useState(q);

  // Debounce URL writes.
  useEffect(() => {
    const t = setTimeout(() => {
      if (value !== q) setQ(value || null);
    }, 300);
    return () => clearTimeout(t);
  }, [value, q, setQ]);

  // Keep input in sync when the URL changes externally (back button, link).
  useEffect(() => setValue(q), [q]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
          aria-label="Clear"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
