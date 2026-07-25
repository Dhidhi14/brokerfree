import { Link } from 'react-router-dom';
import { FileText, Loader2 } from 'lucide-react';
import { AgreementStatusBadge } from '@/components/agreement/agreement-status-badge';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMyAgreementsQuery } from '@/hooks/use-agreements';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type {
  Agreement,
  AgreementPartySummary,
  AgreementPropertySummary,
} from '@/types/agreement.types';

function getPropertySummary(
  property: Agreement['property']
): AgreementPropertySummary | null {
  return typeof property === 'string' ? null : property;
}

function getPartySummary(
  party: Agreement['tenant'] | Agreement['owner']
): AgreementPartySummary | null {
  return typeof party === 'string' ? null : party;
}

function getOtherPartyName(agreement: Agreement, userId: string | undefined): string {
  const tenant = getPartySummary(agreement.tenant);
  const owner = getPartySummary(agreement.owner);
  const tenantId = typeof agreement.tenant === 'string' ? agreement.tenant : agreement.tenant._id;
  const ownerId = typeof agreement.owner === 'string' ? agreement.owner : agreement.owner._id;

  if (userId === tenantId) {
    return owner?.fullName ?? 'Owner';
  }
  if (userId === ownerId) {
    return tenant?.fullName ?? 'Tenant';
  }
  return tenant?.fullName ?? owner?.fullName ?? 'Counterparty';
}

export function MyAgreementsPage() {
  const user = useAuthStore((state) => state.user);
  const { data: agreements = [], isLoading, isError, error } = useMyAgreementsQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Agreements</h1>
          <p className="mt-2 text-muted-foreground">
            Digital rent agreements for your accepted applications.
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
                {getApiErrorMessage(error, 'Failed to load agreements')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && agreements.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground">
                No rent agreements yet. Once an application is accepted, you can generate one
                from your applications list.
              </p>
              <Button asChild variant="outline">
                <Link
                  to={user?.role === 'owner' ? '/owner/applications' : '/tenant/applications'}
                >
                  Go to applications
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && agreements.length > 0 ? (
          <ul className="space-y-4">
            {agreements.map((agreement) => {
              const property = getPropertySummary(agreement.property);
              const otherParty = getOtherPartyName(agreement, user?._id);

              return (
                <li key={agreement._id}>
                  <Link to={`/agreements/${agreement._id}`} className="block">
                    <Card className="transition-shadow hover:shadow-md">
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold leading-snug">
                              {property?.title ?? 'Property'}
                            </h2>
                            <AgreementStatusBadge status={agreement.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">With {otherParty}</p>
                        </div>
                        <p className="shrink-0 text-base font-semibold text-indigo-700">
                          {formatCurrency(agreement.terms.rent)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
