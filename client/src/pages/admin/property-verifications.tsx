import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePendingPropertiesQuery, useReviewPropertyMutation } from '@/hooks/use-properties';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { PendingProperty } from '@/types/property.types';

function PropertyDetailsDialog({
  property,
  open,
  onOpenChange,
}: {
  property: PendingProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property.title}</DialogTitle>
          <DialogDescription>
            Submitted by {property.owner.fullName} · {property.owner.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {property.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {property.photos.map((photo) => (
                <img
                  key={photo.publicId}
                  src={photo.url}
                  alt={property.title}
                  className="aspect-square rounded-md border object-cover"
                />
              ))}
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">{property.description}</p>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Rent</dt>
              <dd className="font-medium">{formatCurrency(property.rent)}/month</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Deposit</dt>
              <dd className="font-medium">{formatCurrency(property.deposit)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{property.propertyType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Area</dt>
              <dd>{property.area} sq ft</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="flex items-start gap-1">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {property.address.line1}, {property.address.locality}, {property.address.city} —{' '}
                {property.address.pincode}
              </dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  property,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  property: PendingProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject property</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting &quot;{property?.title}&quot;. The owner will see this
            message.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="property-rejection-reason">Rejection reason</Label>
          <Textarea
            id="property-rejection-reason"
            placeholder="e.g. Photos do not match the listing description"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || isPending}
            onClick={() => onConfirm(reason.trim())}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting…
              </>
            ) : (
              'Reject'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminPropertyVerificationsPage() {
  const { data: pending = [], isLoading, isError, error, refetch } = usePendingPropertiesQuery();
  const reviewMutation = useReviewPropertyMutation();

  const [detailsProperty, setDetailsProperty] = useState<PendingProperty | null>(null);
  const [rejectProperty, setRejectProperty] = useState<PendingProperty | null>(null);

  const handleApprove = (property: PendingProperty) => {
    reviewMutation.mutate(
      { id: property._id, decision: 'approve' },
      {
        onSuccess: () => {
          toast.success(`"${property.title}" is now live`);
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to approve property'));
        },
      }
    );
  };

  const handleReject = (reason: string) => {
    if (!rejectProperty) return;

    reviewMutation.mutate(
      { id: rejectProperty._id, decision: 'reject', rejectionReason: reason },
      {
        onSuccess: () => {
          toast.success(`"${rejectProperty.title}" has been rejected`);
          setRejectProperty(null);
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to reject property'));
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 animate-slide-up md:py-12">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Property verifications</h1>
        <p className="mt-2 text-muted-foreground">
          Review pending property listings before they go live.
        </p>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isError ? (
          <Card className="mt-8 border-destructive/50">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-destructive">
                {getApiErrorMessage(error, 'Failed to load pending properties')}
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && pending.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pending property verifications</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && pending.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {pending.map((property) => (
              <li key={property._id}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{property.title}</CardTitle>
                    <CardDescription>
                      {property.owner.fullName} · {property.owner.email} · {property.owner.phone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd>{formatDate(property.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Location</dt>
                        <dd>
                          {property.address.locality}, {property.address.city}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Rent</dt>
                        <dd>{formatCurrency(property.rent)}/month</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Type</dt>
                        <dd>{property.propertyType}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsProperty(property)}
                      >
                        View details
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={reviewMutation.isPending}
                        onClick={() => handleApprove(property)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={reviewMutation.isPending}
                        onClick={() => setRejectProperty(property)}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </main>

      <PropertyDetailsDialog
        property={detailsProperty}
        open={detailsProperty !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsProperty(null);
        }}
      />

      <RejectDialog
        property={rejectProperty}
        open={rejectProperty !== null}
        onOpenChange={(open) => {
          if (!open) setRejectProperty(null);
        }}
        onConfirm={handleReject}
        isPending={reviewMutation.isPending}
      />
    </div>
  );
}
