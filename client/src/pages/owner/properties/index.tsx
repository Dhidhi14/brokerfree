import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Clapperboard, Loader2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/navbar';
import { PropertyCard } from '@/components/property/property-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useDeletePropertyMutation,
  useMyPropertiesQuery,
} from '@/hooks/use-properties';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Property, VideoVerificationStatus } from '@/types/property.types';

function videoTourCta(status: VideoVerificationStatus | undefined): {
  label: string;
  icon: typeof Clapperboard;
} {
  if (!status || status === 'not_submitted') {
    return { label: 'Add Video Tour', icon: Clapperboard };
  }
  if (status === 'processing') {
    return { label: 'Verification in progress', icon: Loader2 };
  }
  if (status === 'failed') {
    return { label: 'Retry Video Tour', icon: Clapperboard };
  }
  return { label: 'View Verification', icon: ShieldCheck };
}

export function MyPropertiesPage() {
  const { data: properties = [], isLoading, isError, error } = useMyPropertiesQuery();
  const deleteMutation = useDeletePropertyMutation();
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const handleConfirmDelete = () => {
    if (!propertyToDelete) return;

    deleteMutation.mutate(propertyToDelete._id, {
      onSuccess: () => {
        toast.success('Property deleted');
        setPropertyToDelete(null);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to delete property'));
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 animate-slide-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My properties</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your listings and track verification status.
            </p>
          </div>
          <Button asChild className="brand-gradient text-primary-foreground hover:opacity-90">
            <Link to="/owner/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add property
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isError ? (
          <Card className="mt-8 border-destructive/30">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">
                {getApiErrorMessage(error, 'Failed to load your properties')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && properties.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No properties yet</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                List your first property on BrokerFree. Verified owners can create listings that
                reach tenants directly.
              </p>
              <Button asChild className="mt-6 brand-gradient text-primary-foreground hover:opacity-90">
                <Link to="/owner/properties/new">Add your first property</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && properties.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const videoStatus = property.videoVerification?.status;
              const cta = videoTourCta(videoStatus);
              const CtaIcon = cta.icon;

              return (
                <div key={property._id} className="space-y-2">
                  <PropertyCard property={property} showStatus />
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={`/owner/properties/${property._id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPropertyToDelete(property);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <Button asChild variant="outline" className="w-full" size="sm">
                    <Link
                      to={`/owner/properties/${property._id}/video-tour`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CtaIcon
                        className={
                          videoStatus === 'processing'
                            ? 'mr-2 h-4 w-4 animate-spin'
                            : 'mr-2 h-4 w-4'
                        }
                      />
                      {cta.label}
                      {videoStatus === 'completed' &&
                      property.videoVerification?.overallMatchScore !== undefined
                        ? ` · ${Math.round(property.videoVerification.overallMatchScore)}%`
                        : null}
                    </Link>
                  </Button>
                  {property.status === 'inactive' && property.rejectionReason ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <span className="font-medium">Rejection reason:</span>{' '}
                      {property.rejectionReason}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </main>

      <Dialog
        open={propertyToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setPropertyToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete property?</DialogTitle>
            <DialogDescription>
              This permanently removes{' '}
              <span className="font-medium text-foreground">
                {propertyToDelete?.title ?? 'this listing'}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setPropertyToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyPropertiesPage;
