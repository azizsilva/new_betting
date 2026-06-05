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
  // Hidden in the back-office panel and in the full-screen game launcher.
  if (pathname.startsWith("/panel") || pathname.startsWith("/casino/play")) return null;

  return (
    <>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
      <MobileDrawer />
    </>
  );
}
