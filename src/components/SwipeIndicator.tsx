import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeIndicatorProps {
  currentIndex: number;
  totalItems: number;
  labels: string[];
}

export function SwipeIndicator({ currentIndex, totalItems, labels }: SwipeIndicatorProps) {
  const prevLabel = currentIndex > 0 ? labels[currentIndex - 1] : labels[totalItems - 1];
  const nextLabel = currentIndex < totalItems - 1 ? labels[currentIndex + 1] : labels[0];

  return (
    <div className="flex items-center justify-between px-4 py-1 text-xs text-muted-foreground">
      {/* Left indicator */}
      <div className="flex items-center gap-1 opacity-60">
        <ChevronLeft className="w-3 h-3" />
        <span className="hidden sm:inline">{prevLabel}</span>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalItems }).map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              index === currentIndex 
                ? 'bg-primary w-4' 
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Right indicator */}
      <div className="flex items-center gap-1 opacity-60">
        <span className="hidden sm:inline">{nextLabel}</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
}