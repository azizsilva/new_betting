"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { ProfileContent } from "@/components/profile/profile-content";
import { useAuthStore } from "@/store/auth";
import { fetchMe } from "@/lib/auth-api";
import { Loader2 } from "lucide-react";

function ProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, accessToken, setUser } = useAuthStore();
  const [active, setActive] = useState(params.get("section") ?? "welcome");

  // Guard: bounce to home if not authenticated.
  useEffect(() => {
    if (!accessToken) router.replace("/");
  }, [accessToken, router]);

  // Deep-link: ?section=operations selects that panel.
  useEffect(() => {
    const s = params.get("section");
    if (s) setActive(s);
  }, [params]);

  // Fetch fresh profile (balance can change server-side).
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  const current = data ?? user;

  if (!accessToken || (!current && isLoading)) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="size-8 animate-spin text-gold" />
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row">
        <ProfileSidebar user={current} active={active} onSelect={setActive} />
        <div className="flex-1">
          <ProfileContent user={current} active={active} />
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="grid h-screen place-items-center">
          <Loader2 className="size-8 animate-spin text-gold" />
        </div>
      }
    >
      <ProfileInner />
    </Suspense>
  );
}
