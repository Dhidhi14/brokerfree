import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Loader2, MessageSquare, Phone, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationStatusBadge } from '@/components/application/application-status-badge';
import { RespondDialog } from '@/components/application/respond-dialog';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAgreementMutation } from '@/hooks/use-agreements';
import {
  useReceivedApplicationsQuery,
  useRespondToApplicationMutation,
} from '@/hooks/use-applications';
import { useGetOrCreateConversationMutation } from '@/hooks/use-chat';
import { useMyPropertiesQuery } from '@/hooks/use-properties';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format-date';
import type {
  Application,
  ApplicationStatus,
  ApplicationTenantSummary,
  ReceivedApplicationsFilters,
} from '@/types/application.types';

const STATUS_FILTERS: Array<{ value: 'all' | ApplicationStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function getTenantSummary(
  tenant: Application['tenant']
): ApplicationTenantSummary | null {
  return typeof tenant === 'string' ? null : tenant;
}

function getPropertyTitle(property: Application['property']): string {
  return typeof property === 'string' ? 'Property' : property.title;
}

function getPropertyId(property: Application['property']): string {
  return typeof property === 'string' ? property : property._id;
}

function getTenantId(tenant: Application['tenant']): string | null {
  return typeof tenant === 'string' ? tenant : tenant._id;
}

export function OwnerApplicationsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    tenantName: string;
  } | null>(null);
  const [messagingApplicationId, setMessagingApplicationId] = useState<string | null>(null);

  const filters = useMemo<ReceivedApplicationsFilters>(() => {
    const next: ReceivedApplicationsFilters = {};
    if (statusFilter !== 'all') next.status = statusFilter;
    if (propertyFilter !== 'all') next.propertyId = propertyFilter;
    return next;
  }, [statusFilter, propertyFilter]);

  const { data: properties = [] } = useMyPropertiesQuery();
  const {
    data: applications = [],
    isLoading,
    isError,
    error,
  } = useReceivedApplicationsQuery(filters);
  const respondMutation = useRespondToApplicationMutation();
  const startChatMutation = useGetOrCreateConversationMutation();
  const createAgreementMutation = useCreateAgreementMutation();
  const [agreementApplicationId, setAgreementApplicationId] = useState<string | null>(null);

  const handleAccept = (applicationId: string) => {
    respondMutation.mutate(
      { id: applicationId, decision: 'accept' },
      {
        onSuccess: () => toast.success('Application accepted'),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to accept application')),
      }
    );
  };

  const handleMessageTenant = (application: Application) => {
    const tenantId = getTenantId(application.tenant);
    const propertyId = getPropertyId(application.property);
    if (!tenantId) {
      toast.error('Tenant details unavailable');
      return;
    }

    setMessagingApplicationId(application._id);
    startChatMutation.mutate(
      { propertyId, otherUserId: tenantId },
      {
        onSuccess: (conversation) => {
          navigate(`/chat/${conversation._id}`);
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to start conversation'));
        },
        onSettled: () => {
          setMessagingApplicationId(null);
        },
      }
    );
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
      <main className="mx-auto max-w-4xl px-4 py-8 animate-slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="mt-2 text-muted-foreground">
            Review tenant applications for your listings.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'all' | ApplicationStatus)}
          >
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger aria-label="Filter by property">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property._id} value={property._id}>
                  {property.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <p className="text-muted-foreground">No applications match these filters yet.</p>
              <Button asChild variant="outline">
                <Link to="/owner/properties">View my properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && applications.length > 0 ? (
          <ul className="space-y-4">
            {applications.map((application) => {
              const tenant = getTenantSummary(application.tenant);
              const propertyId = getPropertyId(application.property);
              const isResponding =
                respondMutation.isPending && respondMutation.variables?.id === application._id;

              return (
                <li key={application._id}>
                  <Card>
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-semibold">
                            {tenant?.fullName ?? 'Tenant'}
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            <Link
                              to={`/properties/${propertyId}`}
                              className="hover:text-primary hover:underline"
                            >
                              {getPropertyTitle(application.property)}
                            </Link>
                          </p>
                        </div>
                        <ApplicationStatusBadge status={application.status} />
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {tenant?.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {tenant.phone}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {application.occupants} occupant
                          {application.occupants === 1 ? '' : 's'}
                        </span>
                        <span>Move-in {formatDate(application.moveInDate)}</span>
                      </div>

                      <p className="text-sm whitespace-pre-wrap">{application.message}</p>

                      {application.ownerResponse ? (
                        <p className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                          <span className="font-medium">Your response: </span>
                          {application.ownerResponse}
                        </p>
                      ) : null}

                      {application.status === 'pending' ||
                      application.status === 'accepted' ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={messagingApplicationId === application._id}
                            onClick={() => handleMessageTenant(application)}
                          >
                            {messagingApplicationId === application._id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Opening…
                              </>
                            ) : (
                              <>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Message Tenant
                              </>
                            )}
                          </Button>

                          {application.status === 'pending' ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                className="brand-gradient text-primary-foreground hover:opacity-90"
                                disabled={isResponding}
                                onClick={() => handleAccept(application._id)}
                              >
                                {isResponding &&
                                respondMutation.variables?.decision === 'accept' ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Accepting…
                                  </>
                                ) : (
                                  'Accept'
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isResponding}
                                onClick={() =>
                                  setRejectTarget({
                                    id: application._id,
                                    tenantName: tenant?.fullName ?? 'this tenant',
                                  })
                                }
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}

                          {application.status === 'accepted' ? (
                            <Button
                              type="button"
                              size="sm"
                              className="brand-gradient text-primary-foreground hover:opacity-90"
                              disabled={agreementApplicationId === application._id}
                              onClick={() => handleOpenAgreement(application._id)}
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
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>

      {rejectTarget ? (
        <RespondDialog
          applicationId={rejectTarget.id}
          tenantName={rejectTarget.tenantName}
          open={Boolean(rejectTarget)}
          onOpenChange={(open) => {
            if (!open) setRejectTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
