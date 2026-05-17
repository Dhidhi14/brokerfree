import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { KycStatus } from '@/types/kyc.types';

const STATUS_LABELS: Record<KycStatus, string> = {
  not_submitted: 'Not submitted',
  pending: 'Under review',
  verified: 'Verified',
  rejected: 'Rejected',
};

const STATUS_STYLES: Record<KycStatus, string> = {
  not_submitted: 'bg-muted text-muted-foreground hover:bg-muted',
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200',
  rejected: 'bg-destructive/15 text-destructive hover:bg-destructive/15 border-destructive/30',
};

interface KycStatusBadgeProps {
  status: KycStatus;
  className?: string;
}

export function KycStatusBadge({ status, className }: KycStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize', STATUS_STYLES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
