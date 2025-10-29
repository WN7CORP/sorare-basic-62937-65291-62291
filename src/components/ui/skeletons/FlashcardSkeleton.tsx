import { Skeleton } from "@/components/ui/skeleton";

export const FlashcardSkeleton = () => {
  return (
    <div className="w-full max-w-full mx-auto px-2 sm:px-4 py-4 space-y-4">
      <Skeleton className="h-4 w-32 mx-auto" />
      <Skeleton className="min-h-[300px] w-full rounded-xl" />
      <div className="flex justify-between gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>
    </div>
  );
};
