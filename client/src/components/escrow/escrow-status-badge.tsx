import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EscrowStatus } from '@/types/escrow.types';

const STATUS_LABELS: Record<EscrowStatus, string> = {
  pending: 'Pending payment',
  held: 'Protected',
  released: 'Released',
  refunded: 'Refunded',
  disputed: 'Disputed',
};

const STATUS_VARIANTS: Record<EscrowStatus, string> = {
  pending: 'bg-muted text-muted-foreground border-border',
  held: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  released: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  refunded: 'bg-amber-100 text-amber-800 border-amber-200',
  disputed: 'bg-red-100 text-red-800 border-red-200',
};

interface EscrowStatusBadgeProps {
  status: EscrowStatus;
  className?: string;
}

export function EscrowStatusBadge({ status, className }: EscrowStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_VARIANTS[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
