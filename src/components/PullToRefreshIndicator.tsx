import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  progress: number;
  pullDistance: number;
}

export const PullToRefreshIndicator = ({
  isPulling,
  progress,
  pullDistance
}: PullToRefreshIndicatorProps) => {
  if (!isPulling && pullDistance === 0) return null;

  const isTriggered = progress >= 1;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex items-center justify-center z-50 transition-transform"
      style={{
        transform: `translateY(${Math.min(pullDistance - 40, 40)}px)`,
        opacity: Math.min(progress, 1)
      }}
    >
      <div className="bg-card border border-border rounded-full p-3 shadow-lg">
        {isTriggered ? (
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
        ) : (
          <ArrowDown
            className="w-5 h-5 text-muted-foreground transition-transform"
            style={{
              transform: `rotate(${progress * 180}deg)`
            }}
          />
        )}
      </div>
    </div>
  );
};
