import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function HeroSkeleton() {
  return <Skeleton className="aspect-[1920/448] min-h-40 w-full rounded-2xl" />;
}

export function JackpotsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

export function TilesSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-2xl" />
      ))}
    </div>
  );
}

export function GameGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
      ))}
    </div>
  );
}

