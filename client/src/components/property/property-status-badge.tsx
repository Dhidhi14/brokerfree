import type { PropertyStatus } from '@/types/property.types';
import { PROPERTY_STATUS_LABELS } from '@/constants/property.constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_VARIANTS: Record<PropertyStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  'pending-verification': 'bg-amber-100 text-amber-800 border-amber-200',
  live: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rented: 'bg-blue-100 text-blue-800 border-blue-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
};

interface PropertyStatusBadgeProps {
  status: PropertyStatus;
  className?: string;
}

export function PropertyStatusBadge({ status, className }: PropertyStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_VARIANTS[status], className)}>
      {PROPERTY_STATUS_LABELS[status]}
    </Badge>
  );
}
