import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiVerifiedBadgeProps {
  score: number;
  className?: string;
  size?: 'sm' | 'md';
}

function scoreTone(score: number): string {
  if (score >= 80) {
    return 'border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 shadow-sm shadow-emerald-100';
  }
  if (score >= 50) {
    return 'border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 shadow-sm shadow-amber-100';
  }
  return 'border-red-300/80 bg-gradient-to-r from-red-50 to-rose-50 text-red-800 shadow-sm shadow-red-100';
}

export function AiVerifiedBadge({ score, className, size = 'sm' }: AiVerifiedBadgeProps) {
  const rounded = Math.round(score);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-tight',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        scoreTone(score),
        className
      )}
    >
      <ShieldCheck className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      {rounded}% AI-Verified
    </span>
  );
}

export function matchScoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function matchScoreBgClass(score: number): string {
  if (score >= 80) return 'from-emerald-500/15 via-teal-500/10 to-transparent';
  if (score >= 50) return 'from-amber-500/15 via-orange-500/10 to-transparent';
  return 'from-red-500/15 via-rose-500/10 to-transparent';
}
