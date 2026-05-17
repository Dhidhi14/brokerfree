import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Loader2 } from 'lucide-react';
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
import { usePendingKycQuery, useReviewKycMutation } from '@/hooks/use-kyc';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/format-date';
import type { KycDocument, PendingKycOwner } from '@/types/kyc.types';

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

function DocumentsDialog({
  owner,
  open,
  onOpenChange,
}: {
  owner: PendingKycOwner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const documents = owner?.kyc.documents ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documents — {owner?.fullName}</DialogTitle>
          <DialogDescription>Uploaded KYC documents for review.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents available.</p>
          ) : (
            documents.map((doc: KycDocument) => (
              <div key={doc.publicId} className="space-y-2">
                <p className="text-sm font-medium capitalize">{doc.type}</p>
                {isPdfUrl(doc.url) ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Open PDF
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <img
                    src={doc.url}
                    alt={`${doc.type} document`}
                    className="max-h-[50vh] w-full rounded-md border object-contain"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  owner,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  owner: PendingKycOwner | null;
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
          <DialogTitle>Reject verification</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting {owner?.fullName}&apos;s KYC submission. The owner
            will see this message.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="rejection-reason">Rejection reason</Label>
          <Textarea
            id="rejection-reason"
            placeholder="e.g. Aadhaar image is blurry or PAN does not match name"
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

export function AdminVerificationsPage() {
  const { data: pending = [], isLoading, isError, error, refetch } = usePendingKycQuery();
  const reviewMutation = useReviewKycMutation();

  const [documentsOwner, setDocumentsOwner] = useState<PendingKycOwner | null>(null);
  const [rejectOwner, setRejectOwner] = useState<PendingKycOwner | null>(null);

  const handleApprove = (owner: PendingKycOwner) => {
    reviewMutation.mutate(
      { userId: owner.id, decision: 'approve' },
      {
        onSuccess: () => {
          toast.success(`${owner.fullName} has been verified`);
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to approve'));
        },
      }
    );
  };

  const handleReject = (reason: string) => {
    if (!rejectOwner) return;

    reviewMutation.mutate(
      { userId: rejectOwner.id, decision: 'reject', rejectionReason: reason },
      {
        onSuccess: () => {
          toast.success(`${rejectOwner.fullName} has been rejected`);
          setRejectOwner(null);
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to reject'));
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

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Owner verifications</h1>
        <p className="mt-2 text-muted-foreground">
          Review and approve owner identity documents.
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
                {getApiErrorMessage(error, 'Failed to load pending verifications')}
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
              <p className="text-muted-foreground">No pending verifications</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && pending.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {pending.map((owner) => (
              <li key={owner.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{owner.fullName}</CardTitle>
                    <CardDescription>
                      {owner.email} · {owner.phone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd>{formatDateTime(owner.submittedAt ?? owner.kyc.submittedAt)}</dd>
                      </div>
                      {owner.kyc.aadhaarLast4 ? (
                        <div>
                          <dt className="text-muted-foreground">Aadhaar</dt>
                          <dd className="font-mono">XXXX XXXX {owner.kyc.aadhaarLast4}</dd>
                        </div>
                      ) : null}
                      {owner.kyc.panLast4 ? (
                        <div>
                          <dt className="text-muted-foreground">PAN</dt>
                          <dd className="font-mono">XXXXX{owner.kyc.panLast4}X</dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDocumentsOwner(owner)}
                      >
                        View documents
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={reviewMutation.isPending}
                        onClick={() => handleApprove(owner)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={reviewMutation.isPending}
                        onClick={() => setRejectOwner(owner)}
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

      <DocumentsDialog
        owner={documentsOwner}
        open={documentsOwner !== null}
        onOpenChange={(open) => {
          if (!open) setDocumentsOwner(null);
        }}
      />

      <RejectDialog
        owner={rejectOwner}
        open={rejectOwner !== null}
        onOpenChange={(open) => {
          if (!open) setRejectOwner(null);
        }}
        onConfirm={handleReject}
        isPending={reviewMutation.isPending}
      />
    </div>
  );
}
