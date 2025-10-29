import { Skeleton } from "@/components/ui/skeleton";

export const LivroCardSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-[140px] space-y-2">
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
};
