import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationStatusBadge } from '@/components/application/application-status-badge';
import { Navbar } from '@/components/layout/navbar';
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
import { useCreateAgreementMutation } from '@/hooks/use-agreements';
import {
  useMyApplicationsQuery,
  useWithdrawApplicationMutation,
} from '@/hooks/use-applications';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format-date';
import { formatCurrency } from '@/lib/utils';
import type {
  Application,
  ApplicationPropertySummary,
} from '@/types/application.types';

function getPropertySummary(
  property: Application['property']
): ApplicationPropertySummary | null {
  return typeof property === 'string' ? null : property;
}

function getPropertyId(property: Application['property']): string {
  return typeof property === 'string' ? property : property._id;
}

function getCoverUrl(property: ApplicationPropertySummary | null): string | undefined {
  if (!property?.photos?.length) return undefined;
  return property.photos.find((photo) => photo.isCover)?.url ?? property.photos[0]?.url;
}

function previewMessage(message: string, max = 120): string {
  if (message.length <= max) return message;
  return `${message.slice(0, max).trimEnd()}…`;
}

export function TenantApplicationsPage() {
  const navigate = useNavigate();
  const { data: applications = [], isLoading, isError, error } = useMyApplicationsQuery();
  const withdrawMutation = useWithdrawApplicationMutation();
  const createAgreementMutation = useCreateAgreementMutation();
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [agreementApplicationId, setAgreementApplicationId] = useState<string | null>(null);

  const handleWithdraw = () => {
    if (!withdrawId) return;

    withdrawMutation.mutate(withdrawId, {
      onSuccess: () => {
        toast.success('Application withdrawn');
        setWithdrawId(null);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to withdraw application'));
      },
    });
  };

  const handleOpenAgreement = (applicationId: string) => {
    setAgreementApplicationId(applicationId);
    createAgreementMutation.mutate(applicationId, {
      onSuccess: (agreement) => {
        navigate(`/agreements/${agreement._id}`);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to open agreement'));
      },
      onSettled: () => {
        setAgreementApplicationId(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="mt-2 text-muted-foreground">
            Track applications you&apos;ve submitted to verified listings.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isError ? (
          <Card className="border-destructive/30">
            <CardContent className="py-12 text-center">
              <p className="text-destructive">
                {getApiErrorMessage(error, 'Failed to load applications')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && applications.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 py-12 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t applied to any properties yet.
              </p>
              <Button asChild className="brand-gradient text-primary-foreground hover:opacity-90">
                <Link to="/properties">Browse properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && applications.length > 0 ? (
          <ul className="space-y-4">
            {applications.map((application) => {
              const property = getPropertySummary(application.property);
              const propertyId = getPropertyId(application.property);
              const coverUrl = getCoverUrl(property);

              return (
                <li key={application._id}>
                  <Card className="overflow-hidden transition-shadow hover:shadow-md">
                    <Link to={`/properties/${propertyId}`} className="block">
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                        <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-32">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={property?.title ?? 'Property'}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h2 className="font-semibold leading-snug">
                              {property?.title ?? 'Property'}
                            </h2>
                            <ApplicationStatusBadge status={application.status} />
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {property?.address?.city ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {property.address.city}
                              </span>
                            ) : null}
                            {property?.rent !== undefined ? (
                              <span>{formatCurrency(property.rent)}/mo</span>
                            ) : null}
                            <span>Move-in {formatDate(application.moveInDate)}</span>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {previewMessage(application.message)}
                          </p>

                          {(application.status === 'accepted' ||
                            application.status === 'rejected') &&
                          application.ownerResponse ? (
                            <p className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                              <span className="font-medium text-foreground">Owner note: </span>
                              {application.ownerResponse}
                            </p>
                          ) : null}
                        </div>
                      </CardContent>
                    </Link>

                    {application.status === 'pending' ||
                    application.status === 'accepted' ? (
                      <div className="flex flex-wrap gap-2 border-t px-4 py-3">
                        {application.status === 'pending' ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.preventDefault();
                              setWithdrawId(application._id);
                            }}
                          >
                            Withdraw
                          </Button>
                        ) : null}
                        {application.status === 'accepted' ? (
                          <Button
                            type="button"
                            size="sm"
                            className="brand-gradient text-primary-foreground hover:opacity-90"
                            disabled={agreementApplicationId === application._id}
                            onClick={(event) => {
                              event.preventDefault();
                              handleOpenAgreement(application._id);
                            }}
                          >
                            {agreementApplicationId === application._id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Opening…
                              </>
                            ) : (
                              <>
                                <FileText className="mr-2 h-4 w-4" />
                                Agreement
                              </>
                            )}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>

      <Dialog open={Boolean(withdrawId)} onOpenChange={(open) => !open && setWithdrawId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw application?</DialogTitle>
            <DialogDescription>
              You can apply again later if this property is still available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWithdrawId(null)}
              disabled={withdrawMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Withdrawing…
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
