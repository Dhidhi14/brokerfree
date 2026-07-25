import { Link } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { EscrowStatusBadge } from '@/components/escrow/escrow-status-badge';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMyEscrowsQuery } from '@/hooks/use-escrow';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type {
  Escrow,
  EscrowPartySummary,
  EscrowPropertySummary,
} from '@/types/escrow.types';

function getProperty(property: Escrow['property']): EscrowPropertySummary | null {
  return typeof property === 'string' ? null : property;
}

function getParty(party: Escrow['tenant'] | Escrow['owner']): EscrowPartySummary | null {
  return typeof party === 'string' ? null : party;
}

function getAgreementId(agreement: Escrow['agreement']): string {
  return typeof agreement === 'string' ? agreement : agreement._id;
}

export function MyEscrowsPage() {
  const user = useAuthStore((state) => state.user);
  const { data: escrows = [], isLoading, isError, error } = useMyEscrowsQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Deposits</h1>
          <p className="mt-2 text-muted-foreground">
            Track security deposits held in BrokerFree escrow.
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
                {getApiErrorMessage(error, 'Failed to load deposits')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && escrows.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Shield className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground">
                No escrow deposits yet. Once a rent agreement is executed, the tenant can
                pay the deposit here.
              </p>
              <Button asChild variant="outline">
                <Link to="/agreements">View agreements</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && escrows.length > 0 ? (
          <ul className="space-y-4">
            {escrows.map((escrow) => {
              const property = getProperty(escrow.property);
              const tenant = getParty(escrow.tenant);
              const owner = getParty(escrow.owner);
              const agreementId = getAgreementId(escrow.agreement);
              const counterparty =
                user?._id === (typeof escrow.tenant === 'string' ? escrow.tenant : escrow.tenant._id)
                  ? owner?.fullName ?? 'Owner'
                  : tenant?.fullName ?? 'Tenant';

              return (
                <li key={escrow._id}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-semibold">
                            {property?.title ?? 'Property deposit'}
                          </h2>
                          <EscrowStatusBadge status={escrow.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          With {counterparty} · {formatCurrency(escrow.amount)}
                        </p>
                      </div>
                      <Button asChild variant="outline" className="shrink-0">
                        <Link to={`/agreements/${agreementId}`}>View agreement</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
