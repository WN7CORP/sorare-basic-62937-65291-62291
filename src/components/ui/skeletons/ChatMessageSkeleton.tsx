import { Skeleton } from "@/components/ui/skeleton";

export const ChatMessageSkeleton = () => {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
};
