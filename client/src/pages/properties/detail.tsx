import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bath,
  Building2,
  Loader2,
  MapPin,
  Maximize2,
  Star,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { PropertyStatusBadge } from '@/components/property/property-status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePropertyQuery } from '@/hooks/use-properties';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type { PropertyOwnerSummary } from '@/types/property.types';

function getOwnerId(owner: string | PropertyOwnerSummary): string {
  return typeof owner === 'string' ? owner : owner._id;
}

function getOwnerSummary(owner: string | PropertyOwnerSummary): PropertyOwnerSummary | null {
  return typeof owner === 'string' ? null : owner;
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: property, isLoading, isError, error } = usePropertyQuery(id);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const ownerSummary = property ? getOwnerSummary(property.owner) : null;
  const isOwner = property && user ? getOwnerId(property.owner) === user._id : false;
  const photos = property?.photos ?? [];
  const activePhoto = photos[activePhotoIndex]?.url ?? photos[0]?.url;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 animate-slide-up">
        <Link
          to="/properties"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>

        {isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isError ? (
          <Card className="border-destructive/30">
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{getApiErrorMessage(error, 'Property not found')}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/properties">Browse properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {property ? (
          <div className="space-y-8">
            {isOwner && property.status !== 'live' ? (
              <div
                className={
                  property.status === 'inactive'
                    ? 'rounded-lg border border-red-200 bg-red-50 p-4 text-red-900'
                    : 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900'
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PropertyStatusBadge status={property.status} />
                  <span className="text-sm font-medium">
                    {property.status === 'pending-verification'
                      ? 'Your listing is under admin review and not visible to tenants yet.'
                      : 'Your listing was rejected and is not publicly visible.'}
                  </span>
                </div>
                {property.status === 'inactive' && property.rejectionReason ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Reason:</span> {property.rejectionReason}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No photos available
                  </div>
                )}
              </div>
              {photos.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.publicId}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={
                        index === activePhotoIndex
                          ? 'shrink-0 overflow-hidden rounded-lg ring-2 ring-primary'
                          : 'shrink-0 overflow-hidden rounded-lg opacity-80 hover:opacity-100'
                      }
                    >
                      <img
                        src={photo.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-16 w-24 object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{property.title}</h1>
                  <p className="mt-2 flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {property.address.line1}
                    {property.address.line2 ? `, ${property.address.line2}` : ''},{' '}
                    {property.address.locality}, {property.address.city}, {property.address.state} —{' '}
                    {property.address.pincode}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{property.propertyType}</Badge>
                  <Badge variant="outline">{formatLabel(property.furnishing)}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <Bath className="h-3 w-3" />
                    {property.bathrooms} bath
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Maximize2 className="h-3 w-3" />
                    {property.area} sq ft
                  </Badge>
                  {property.floor !== undefined ? (
                    <Badge variant="outline">
                      Floor {property.floor}
                      {property.totalFloors ? ` of ${property.totalFloors}` : ''}
                    </Badge>
                  ) : null}
                </div>

                <div>
                  <h2 className="text-lg font-semibold">About this property</h2>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {property.description}
                  </p>
                </div>

                {property.amenities.length > 0 ? (
                  <div>
                    <h2 className="text-lg font-semibold">Amenities</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary">
                          {formatLabel(amenity)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <h2 className="text-lg font-semibold">Tenant preferences</h2>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <li>Bachelors: {property.preferences.bachelors ? 'Welcome' : 'Not preferred'}</li>
                    <li>
                      Families: {property.preferences.families ? 'Welcome' : 'Not preferred'}
                    </li>
                    <li>
                      Working professionals:{' '}
                      {property.preferences.workingProfessionals ? 'Welcome' : 'Not preferred'}
                    </li>
                    <li>
                      Students: {property.preferences.students ? 'Welcome' : 'Not preferred'}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">
                      {formatCurrency(property.rent)}
                      <span className="text-base font-normal text-muted-foreground">/month</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security deposit</span>
                      <span className="font-medium">{formatCurrency(property.deposit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Maintenance</span>
                      <span className="font-medium">
                        {property.maintenance > 0
                          ? formatCurrency(property.maintenance)
                          : 'Included'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {ownerSummary ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Listed by</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {ownerSummary.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{ownerSummary.fullName}</p>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {ownerSummary.rating.average.toFixed(1)} ({ownerSummary.rating.count}{' '}
                          reviews)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Verified BrokerFree listing
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />
          </div>
        ) : null}
      </main>
    </div>
  );
}
