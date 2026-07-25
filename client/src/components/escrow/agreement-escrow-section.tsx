import { useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { EscrowStatusBadge } from '@/components/escrow/escrow-status-badge';
import { PayDepositButton } from '@/components/escrow/pay-deposit-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  useDisputeEscrowMutation,
  useMyEscrowsQuery,
} from '@/hooks/use-escrow';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';
import type { Escrow } from '@/types/escrow.types';

function getAgreementId(agreement: Escrow['agreement']): string {
  return typeof agreement === 'string' ? agreement : agreement._id;
}

interface AgreementEscrowSectionProps {
  agreementId: string;
  depositAmount: number;
  isTenant: boolean;
  isOwner: boolean;
}

export function AgreementEscrowSection({
  agreementId,
  depositAmount,
  isTenant,
  isOwner,
}: AgreementEscrowSectionProps) {
  const { data: escrows = [], isLoading } = useMyEscrowsQuery();
  const disputeMutation = useDisputeEscrowMutation();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');

  const escrow = escrows.find((item) => getAgreementId(item.agreement) === agreementId);
  const canDispute =
    Boolean(escrow) && escrow?.status === 'held' && (isTenant || isOwner);

  const handleDispute = () => {
    if (!escrow) return;

    const note = disputeNote.trim();
    if (note.length < 10) {
      toast.error('Please describe the issue in at least 10 characters');
      return;
    }

    disputeMutation.mutate(
      { id: escrow._id, note },
      {
        onSuccess: () => {
          setDisputeOpen(false);
          setDisputeNote('');
          toast.success('Dispute reported. An admin will review your case.');
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to report dispute'));
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label="Loading escrow" />
        </CardContent>
      </Card>
    );
  }

  if (!escrow || escrow.status === 'pending') {
    return (
      <Card className="border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-background to-violet-50/50">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Security deposit escrow</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pay through BrokerFree — we hold the deposit so it can&apos;t disappear
                  with a broker or owner.
                </p>
              </div>
            </div>
            {escrow ? <EscrowStatusBadge status={escrow.status} /> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-indigo-100 bg-white/70 px-4 py-3">
            <p className="text-sm text-muted-foreground">Amount due</p>
            <p className="text-2xl font-bold text-indigo-700">
              {formatCurrency(escrow?.amount ?? depositAmount)}
            </p>
          </div>

          {isTenant ? (
            <PayDepositButton agreementId={agreementId} className="w-full sm:w-auto" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for the tenant to pay the security deposit into escrow.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (escrow.status === 'held') {
    return (
      <>
        <Card className="overflow-hidden border-indigo-300/80 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-md">
          <CardContent className="space-y-4 py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-100">BrokerFree Escrow</p>
                  <h2 className="text-xl font-bold tracking-tight">Deposit Protected</h2>
                </div>
              </div>
              <EscrowStatusBadge
                status="held"
                className="border-white/30 bg-white/15 text-white"
              />
            </div>

            <p className="text-sm leading-relaxed text-indigo-50/95">
              {formatCurrency(escrow.amount)} is safely held by BrokerFree — not with the
              owner or a broker. It will only be released after a fair move-out resolution.
            </p>

            {canDispute ? (
              <Button
                type="button"
                variant="secondary"
                className="bg-white/95 text-indigo-800 hover:bg-white"
                onClick={() => setDisputeOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report an Issue
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Dialog
          open={disputeOpen}
          onOpenChange={(open) => {
            if (!disputeMutation.isPending) {
              setDisputeOpen(open);
              if (!open) setDisputeNote('');
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report a deposit issue</DialogTitle>
              <DialogDescription>
                Describe what went wrong. An admin will review and can release or refund
                the deposit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="dispute-note">Details</Label>
              <Textarea
                id="dispute-note"
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                placeholder="e.g. Property damage claim / deposit should be refunded because…"
                rows={4}
                disabled={disputeMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisputeOpen(false)}
                disabled={disputeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDispute}
                disabled={disputeMutation.isPending}
              >
                {disputeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit dispute'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (escrow.status === 'released') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-emerald-900">Deposit released to owner</p>
              <EscrowStatusBadge status="released" />
            </div>
            <p className="mt-1 text-sm text-emerald-800">
              {formatCurrency(escrow.amount)} has been marked as released from escrow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (escrow.status === 'refunded') {
    return (
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <Banknote className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-amber-900">Deposit refunded to tenant</p>
              <EscrowStatusBadge status="refunded" />
            </div>
            <p className="mt-1 text-sm text-amber-800">
              {formatCurrency(escrow.amount)} has been refunded via Razorpay.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // disputed
  return (
    <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-red-900">Under dispute</p>
            <EscrowStatusBadge status="disputed" />
          </div>
          <p className="mt-1 text-sm text-red-800">
            This deposit ({formatCurrency(escrow.amount)}) is locked while BrokerFree
            reviews the case. An admin will release or refund it.
          </p>
        </div>
      </div>
    </div>
  );
}
