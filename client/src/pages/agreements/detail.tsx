import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSignature,
  Loader2,
  PartyPopper,
  PenLine,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { AgreementStatusBadge } from '@/components/agreement/agreement-status-badge';
import { AgreementEscrowSection } from '@/components/escrow/agreement-escrow-section';
import { Navbar } from '@/components/layout/navbar';
import { ReviewFormDialog } from '@/components/review/review-form-dialog';
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
import { Separator } from '@/components/ui/separator';
import { useAgreementQuery, useSignAgreementMutation } from '@/hooks/use-agreements';
import { useReviewStatusQuery } from '@/hooks/use-reviews';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, formatDateTime } from '@/lib/format-date';
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

function getPartyId(party: Agreement['tenant'] | Agreement['owner']): string {
  return typeof party === 'string' ? party : party._id;
}

interface SignatureRowProps {
  label: string;
  name: string;
  signedAt?: string;
  isViewer: boolean;
}

function SignatureRow({ label, name, signedAt, isViewer }: SignatureRowProps) {
  const isSigned = Boolean(signedAt);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-background/80 px-4 py-3">
      <div className={isSigned ? 'mt-0.5 text-emerald-600' : 'mt-0.5 text-amber-600'}>
        {isSigned ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="font-semibold">
          {name}
          {isViewer ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
          ) : null}
        </p>
        {isSigned ? (
          <p className="mt-1 text-sm text-emerald-700">Signed {formatDateTime(signedAt)}</p>
        ) : (
          <p className="mt-1 text-sm text-amber-700">Awaiting signature</p>
        )}
      </div>
    </div>
  );
}

interface AgreementDetailContentProps {
  agreement: Agreement;
  userId: string | undefined;
  onRequestSign: () => void;
}

function AgreementDetailContent({
  agreement,
  userId,
  onRequestSign,
}: AgreementDetailContentProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const property = getPropertySummary(agreement.property);
  const tenant = getPartySummary(agreement.tenant);
  const owner = getPartySummary(agreement.owner);
  const tenantId = getPartyId(agreement.tenant);
  const ownerId = getPartyId(agreement.owner);
  const isTenantViewer = userId === tenantId;
  const isOwnerViewer = userId === ownerId;
  const viewerSignedAt = isTenantViewer
    ? agreement.tenantSignedAt
    : isOwnerViewer
      ? agreement.ownerSignedAt
      : undefined;
  const hasViewerSigned = Boolean(viewerSignedAt);
  const canSign =
    (isTenantViewer || isOwnerViewer) &&
    !hasViewerSigned &&
    agreement.status !== 'executed';

  const otherParty = isTenantViewer ? owner : isOwnerViewer ? tenant : null;
  const otherPartyName = otherParty?.fullName ?? (isTenantViewer ? 'Owner' : 'Tenant');
  const canReview =
    agreement.status === 'executed' && (isTenantViewer || isOwnerViewer);

  const { data: reviewStatus, isLoading: isReviewStatusLoading } = useReviewStatusQuery(
    agreement._id,
    canReview
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link to="/agreements" className="hover:text-primary hover:underline">
              Agreements
            </Link>
            <span className="mx-1.5">/</span>
            Detail
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {property?.title ?? 'Rent Agreement'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Between {tenant?.fullName ?? 'Tenant'} and {owner?.fullName ?? 'Owner'}
          </p>
        </div>
        <AgreementStatusBadge status={agreement.status} />
      </div>

      {agreement.status === 'executed' ? (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">Agreement fully executed!</p>
              <p className="mt-1 text-sm text-emerald-800">
                Tenant signed {formatDateTime(agreement.tenantSignedAt)}. Owner signed{' '}
                {formatDateTime(agreement.ownerSignedAt)}.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {agreement.status === 'executed' ? (
        <AgreementEscrowSection
          agreementId={agreement._id}
          depositAmount={agreement.terms.deposit}
          isTenant={isTenantViewer}
          isOwner={isOwnerViewer}
        />
      ) : null}

      {agreement.status === 'executed' ? (
        <Card className="border-indigo-200/70 bg-gradient-to-b from-indigo-50/80 via-background to-violet-50/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Move-In / Move-Out Documentation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Lock property condition with timestamped photos for a fair deposit review.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full brand-gradient text-primary-foreground hover:opacity-90 sm:w-auto">
              <Link to={`/agreements/${agreement._id}/photo-lock`}>
                <Camera className="mr-2 h-4 w-4" />
                Open Photo Lock
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canReview ? (
        <Card className="border-amber-200/70 bg-gradient-to-b from-amber-50/70 via-background to-orange-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                <Star className="h-5 w-5 fill-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Rate your experience</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Bi-directional feedback helps keep BrokerFree fair for everyone.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isReviewStatusLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" />
            ) : reviewStatus?.hasReviewed ? (
              <p className="text-sm text-muted-foreground">You&apos;ve reviewed this rental</p>
            ) : (
              <Button
                type="button"
                className="w-full brand-gradient text-primary-foreground hover:opacity-90 sm:w-auto"
                onClick={() => setReviewOpen(true)}
              >
                <Star className="mr-2 h-4 w-4" />
                Rate {otherPartyName}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {canReview ? (
        <ReviewFormDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          agreementId={agreement._id}
          revieweeName={otherPartyName}
        />
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Lease terms</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Monthly rent</dt>
              <dd className="mt-1 text-lg font-semibold text-indigo-700">
                {formatCurrency(agreement.terms.rent)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Security deposit</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatCurrency(agreement.terms.deposit)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Maintenance</dt>
              <dd className="mt-1 font-medium">
                {formatCurrency(agreement.terms.maintenance)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Move-in date</dt>
              <dd className="mt-1 font-medium">{formatDate(agreement.terms.moveInDate)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Lease duration</dt>
              <dd className="mt-1 font-medium">{agreement.terms.leaseDurationMonths} months</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Notice period</dt>
              <dd className="mt-1 font-medium">{agreement.terms.noticePeriodDays} days</dd>
            </div>
          </dl>

          <Separator className="my-5" />

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.open(agreement.pdfUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View / Download PDF
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-indigo-200/70 bg-gradient-to-b from-indigo-50/80 via-background to-violet-50/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Digital signatures</CardTitle>
              <p className="text-sm text-muted-foreground">
                Signing confirms you accept these terms as a binding commitment.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <SignatureRow
            label="Tenant"
            name={tenant?.fullName ?? 'Tenant'}
            signedAt={agreement.tenantSignedAt}
            isViewer={isTenantViewer}
          />
          <SignatureRow
            label="Owner"
            name={owner?.fullName ?? 'Owner'}
            signedAt={agreement.ownerSignedAt}
            isViewer={isOwnerViewer}
          />

          {canSign ? (
            <div className="pt-2">
              <Button
                type="button"
                className="w-full brand-gradient text-primary-foreground hover:opacity-90 sm:w-auto"
                onClick={onRequestSign}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Sign Agreement
              </Button>
            </div>
          ) : null}

          {hasViewerSigned && agreement.status !== 'executed' ? (
            <p className="pt-1 text-sm text-muted-foreground">
              You&apos;ve signed. We&apos;ll mark this executed once both parties sign.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data: agreement, isLoading, isError, error } = useAgreementQuery(id);
  const signMutation = useSignAgreementMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSign = () => {
    if (!id) return;

    signMutation.mutate(id, {
      onSuccess: (updated) => {
        setConfirmOpen(false);
        if (updated.status === 'executed') {
          toast.success('Agreement fully executed! Both parties have signed.');
        } else {
          toast.success('You signed the agreement. Waiting for the other party.');
        }
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to sign agreement'));
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-slide-up">
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isError ? (
          <Card className="border-destructive/30">
            <CardContent className="space-y-4 py-12 text-center">
              <p className="text-destructive">
                {getApiErrorMessage(error, 'Failed to load agreement')}
              </p>
              <Button asChild variant="outline">
                <Link to="/agreements">Back to agreements</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && agreement ? (
          <AgreementDetailContent
            agreement={agreement}
            userId={user?._id}
            onRequestSign={() => setConfirmOpen(true)}
          />
        ) : null}
      </main>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !signMutation.isPending && setConfirmOpen(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign this rent agreement?</DialogTitle>
            <DialogDescription>
              By signing, you agree to these terms — including rent, deposit, lease duration, and
              notice period — as a digital commitment on BrokerFree. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={signMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="brand-gradient text-primary-foreground hover:opacity-90"
              onClick={handleSign}
              disabled={signMutation.isPending}
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing…
                </>
              ) : (
                <>
                  <PenLine className="mr-2 h-4 w-4" />
                  Confirm and sign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
