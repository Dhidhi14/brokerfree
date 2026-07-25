import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { EscrowStatusBadge } from '@/components/escrow/escrow-status-badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminEscrowsQuery,
  useRefundEscrowMutation,
  useReleaseEscrowMutation,
} from '@/hooks/use-escrow';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';
import type {
  Escrow,
  EscrowPartySummary,
  EscrowPropertySummary,
} from '@/types/escrow.types';

type AdminAction = 'release' | 'refund';

function getProperty(property: Escrow['property']): EscrowPropertySummary | null {
  return typeof property === 'string' ? null : property;
}

function getParty(party: Escrow['tenant'] | Escrow['owner']): EscrowPartySummary | null {
  return typeof party === 'string' ? null : party;
}

export function AdminEscrowManagementPage() {
  const { data: escrows = [], isLoading, isError, error } = useAdminEscrowsQuery();
  const releaseMutation = useReleaseEscrowMutation();
  const refundMutation = useRefundEscrowMutation();

  const [selected, setSelected] = useState<Escrow | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const [note, setNote] = useState('');

  const isPending = releaseMutation.isPending || refundMutation.isPending;

  const openConfirm = (escrow: Escrow, nextAction: AdminAction) => {
    setSelected(escrow);
    setAction(nextAction);
    setNote('');
  };

  const resetConfirm = () => {
    setSelected(null);
    setAction(null);
    setNote('');
  };

  const closeConfirm = () => {
    if (isPending) return;
    resetConfirm();
  };

  const handleConfirm = () => {
    if (!selected || !action) return;

    const payload = {
      id: selected._id,
      note: note.trim() || undefined,
    };

    if (action === 'release') {
      releaseMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Deposit released to owner');
          resetConfirm();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to release deposit'));
        },
      });
      return;
    }

    refundMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Deposit refunded to tenant');
        resetConfirm();
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to refund deposit'));
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 animate-slide-up">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4 -ml-2">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Escrow Management</h1>
          <p className="mt-2 text-muted-foreground">
            Review held and disputed deposits. Release to the owner or refund the tenant.
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
                {getApiErrorMessage(error, 'Failed to load escrows')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && escrows.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Shield className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground">
                No held or disputed deposits right now.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && escrows.length > 0 ? (
          <ul className="space-y-4">
            {escrows.map((escrow) => {
              const property = getProperty(escrow.property);
              const tenant = getParty(escrow.tenant);
              const owner = getParty(escrow.owner);
              const canRelease = escrow.status === 'held';

              return (
                <li key={escrow._id}>
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold">
                              {property?.title ?? 'Property deposit'}
                            </h2>
                            <EscrowStatusBadge status={escrow.status} />
                          </div>
                          <p className="text-lg font-semibold text-indigo-700">
                            {formatCurrency(escrow.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tenant: {tenant?.fullName ?? '—'} · Owner:{' '}
                            {owner?.fullName ?? '—'}
                          </p>
                          {property?.address?.city ? (
                            <p className="text-sm text-muted-foreground">
                              {property.address.locality
                                ? `${property.address.locality}, `
                                : ''}
                              {property.address.city}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {canRelease ? (
                            <Button
                              type="button"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => openConfirm(escrow, 'release')}
                            >
                              Release to Owner
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            className="border-amber-300 text-amber-800 hover:bg-amber-50"
                            onClick={() => openConfirm(escrow, 'refund')}
                          >
                            Refund to Tenant
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>

      <Dialog open={Boolean(selected && action)} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === 'release' ? 'Release deposit to owner?' : 'Refund deposit to tenant?'}
            </DialogTitle>
            <DialogDescription>
              {action === 'release'
                ? 'This marks the escrow as released (ledger update). Confirm before continuing.'
                : 'This triggers a Razorpay refund to the tenant (test mode is simulated).'}
              {selected ? (
                <span className="mt-2 block font-medium text-foreground">
                  Amount: {formatCurrency(selected.amount)}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="admin-escrow-note">Note (optional)</Label>
            <Textarea
              id="admin-escrow-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for this decision…"
              rows={3}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeConfirm} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              className={
                action === 'release'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : action === 'release' ? (
                'Confirm release'
              ) : (
                'Confirm refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
