import { useNavigate } from 'react-router-dom';
import { Bath, Maximize2, MapPin } from 'lucide-react';
import { PropertyStatusBadge } from '@/components/property/property-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Property, PropertyStatus } from '@/types/property.types';
import { cn } from '@/lib/utils';

function getCoverPhoto(property: Property): string | undefined {
  const cover = property.photos.find((photo) => photo.isCover);
  return cover?.url ?? property.photos[0]?.url;
}

function formatFurnishing(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface PropertyCardProps {
  property: Property;
  showStatus?: boolean;
  className?: string;
}

export function PropertyCard({ property, showStatus = false, className }: PropertyCardProps) {
  const navigate = useNavigate();
  const coverUrl = getCoverPhoto(property);

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg',
        className
      )}
      onClick={() => navigate(`/properties/${property._id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
        {showStatus ? (
          <div className="absolute left-3 top-3">
            <PropertyStatusBadge status={property.status as PropertyStatus} />
          </div>
        ) : null}
        <div className="absolute bottom-3 left-3">
          <Badge className="brand-gradient border-0 text-primary-foreground">
            {formatCurrency(property.rent)}/mo
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-semibold text-foreground group-hover:text-primary">
            {property.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {property.address.locality}, {property.address.city}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{property.propertyType}</Badge>
          <Badge variant="outline" className="gap-1">
            <Bath className="h-3 w-3" />
            {property.bathrooms}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Maximize2 className="h-3 w-3" />
            {property.area} sq ft
          </Badge>
          <Badge variant="outline">{formatFurnishing(property.furnishing)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
