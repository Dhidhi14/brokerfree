import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarSize = 'sm' | 'md' | 'lg';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: StarSize;
  className?: string;
  'aria-label'?: string;
}

const SIZE_CLASSES: Record<StarSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

function clampRating(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(5, Math.max(0, value));
}

/** Round to nearest half-star for display (e.g. 4.3 → 4.5). */
function toHalfSteps(value: number): number {
  return Math.round(clampRating(value) * 2) / 2;
}

/**
 * Interactive (indigo-violet) when onChange is provided; amber/gold display otherwise.
 * Display mode supports half-stars for decimal averages.
 */
export function StarRating({
  value,
  onChange,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: StarRatingProps) {
  const isInteractive = typeof onChange === 'function';
  const [hovered, setHovered] = useState<number | null>(null);
  const interactiveValue = clampRating(hovered !== null ? hovered : value);
  const displayValue = toHalfSteps(value);
  const iconSize = SIZE_CLASSES[size];

  if (isInteractive) {
    return (
      <div
        className={cn('inline-flex items-center gap-0.5', className)}
        role="radiogroup"
        aria-label={ariaLabel ?? 'Rating'}
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= interactiveValue;

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
              className={cn(
                'rounded-sm p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                isFilled
                  ? 'text-indigo-600'
                  : 'text-muted-foreground/40 hover:text-violet-500'
              )}
              onMouseEnter={() => setHovered(starValue)}
              onFocus={() => setHovered(starValue)}
              onClick={() => onChange(starValue)}
            >
              <Star
                className={cn(
                  iconSize,
                  'transition-transform',
                  isFilled && 'fill-indigo-600 text-indigo-600',
                  hovered === starValue && 'scale-110'
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={ariaLabel ?? `${clampRating(value).toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starIndex = index + 1;
        const isFull = displayValue >= starIndex;
        const isHalf = !isFull && displayValue >= starIndex - 0.5;

        return (
          <span key={starIndex} className={cn('relative inline-block', iconSize)}>
            <Star className={cn(iconSize, 'text-amber-300/50')} />
            {isFull ? (
              <Star
                className={cn(
                  'absolute inset-0',
                  iconSize,
                  'fill-amber-400 text-amber-400'
                )}
              />
            ) : null}
            {isHalf ? (
              <span className="absolute inset-0 w-1/2 overflow-hidden">
                <Star className={cn(iconSize, 'fill-amber-400 text-amber-400')} />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
