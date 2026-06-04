import {
  HeroSkeleton,
  JackpotsSkeleton,
  TilesSkeleton,
  GameGridSkeleton,
} from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-4 sm:px-6">
      <HeroSkeleton />
      <JackpotsSkeleton />
      <TilesSkeleton />
      <GameGridSkeleton />
    </div>
  );
}
