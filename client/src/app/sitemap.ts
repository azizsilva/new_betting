import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://afrobet216.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; changeFrequency: "daily" | "weekly" }[] = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/casino", priority: 0.9, changeFrequency: "daily" },
    { path: "/casino?tab=live-casino", priority: 0.8, changeFrequency: "daily" },
    { path: "/casino?tab=instant", priority: 0.7, changeFrequency: "daily" },
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
