"use client";

import { useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/store/auth";
import { fetchMe } from "@/lib/auth-api";

// Polls the user profile every 3 seconds to keep balance and data completely real-time.
function SessionUpdater() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchMe()
        .then((me) => setUser(me))
        .catch(() => {}); // ignore errors (e.g., network drops)
    }, 3000);
    
    // Also fetch immediately on window focus
    const onFocus = () => {
      fetchMe().then((me) => setUser(me)).catch(() => {});
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id, setUser]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // No caching, everything fresh
            refetchOnWindowFocus: true, // Always refetch when user returns
            retry: 1,
          },
        },
      }),
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={client}>
        {children}
        <SessionUpdater />
        <LoginModal />
        <Toaster theme="dark" position="top-center" richColors />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
