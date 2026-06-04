"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { MobileDrawer } from "./mobile-drawer";

/**
 * Global mobile bottom nav + slide-in drawer for the PLAYER-FACING site only.
 * The back-office panel (/panel) has its own sidebar, so the bottom nav is
 * hidden there.
 */
export function MobileShell() {
  const pathname = usePathname();
  if (pathname.startsWith("/panel")) return null;

  return (
    <>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
      <MobileDrawer />
    </>
  );
}
