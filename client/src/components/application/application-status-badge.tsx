import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types/application.types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const STATUS_VARIANTS: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  withdrawn: 'bg-muted text-muted-foreground border-border',
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_VARIANTS[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
