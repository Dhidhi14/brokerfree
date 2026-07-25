import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgreementStatus } from '@/types/agreement.types';

const STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: 'Draft',
  'pending-signatures': 'Pending signatures',
  executed: 'Executed',
};

const STATUS_VARIANTS: Record<AgreementStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  'pending-signatures': 'bg-amber-100 text-amber-800 border-amber-200',
  executed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

interface AgreementStatusBadgeProps {
  status: AgreementStatus;
  className?: string;
}

export function AgreementStatusBadge({ status, className }: AgreementStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_VARIANTS[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
