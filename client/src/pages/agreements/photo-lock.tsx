import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Camera, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AreaPhotoUploader } from '@/components/photo-lock/area-photo-uploader';
import { ComparisonReport } from '@/components/photo-lock/comparison-report';
import { PhotoGrid } from '@/components/photo-lock/photo-grid';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  usePhotoLockQuery,
  useSubmitMoveInMutation,
  useSubmitMoveOutMutation,
} from '@/hooks/use-photo-lock';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/format-date';
import { useAuthStore } from '@/store/auth-store';
import type { AreaPhotoSelection } from '@/types/photo-lock.types';

function buildPhotoLockFormData(selections: AreaPhotoSelection[]): FormData {
  const formData = new FormData();
  const areas = selections.map((item) => item.area);

  selections.forEach((item) => {
    formData.append('photos', item.file);
  });
  formData.append('areas', JSON.stringify(areas));

  return formData;
}

export function PhotoLockPage() {
  const { agreementId } = useParams<{ agreementId: string }>();
  const user = useAuthStore((state) => state.user);
  const isTenant = user?.role === 'tenant';

  const { data: photoLock, isLoading, isError, error } = usePhotoLockQuery(agreementId);
  const moveInMutation = useSubmitMoveInMutation(agreementId ?? '');
  const moveOutMutation = useSubmitMoveOutMutation(agreementId ?? '');

  const [moveInSelections, setMoveInSelections] = useState<AreaPhotoSelection[]>([]);
  const [moveOutSelections, setMoveOutSelections] = useState<AreaPhotoSelection[]>([]);

  const handleSubmitMoveIn = () => {
    if (!agreementId) return;
    if (moveInSelections.length === 0) {
      toast.error('Add at least one area photo before submitting');
      return;
    }

    moveInMutation.mutate(buildPhotoLockFormData(moveInSelections), {
      onSuccess: () => {
        setMoveInSelections([]);
        toast.success('Move-in photos submitted successfully');
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to submit move-in photos'));
      },
    });
  };

  const handleSubmitMoveOut = () => {
    if (!agreementId) return;
    if (moveOutSelections.length === 0) {
      toast.error('Add at least one area photo before submitting');
      return;
    }

    moveOutMutation.mutate(buildPhotoLockFormData(moveOutSelections), {
      onSuccess: () => {
        setMoveOutSelections([]);
        toast.success('Move-out photos submitted. Comparison is ready.');
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to submit move-out photos'));
      },
    });
  };

  const moveInSubmitted = photoLock?.moveIn.status === 'submitted';
  const moveOutSubmitted = photoLock?.moveOut.status === 'submitted';
  const comparisonCompleted = photoLock?.comparison.status === 'completed';
  const isSubmitting = moveInMutation.isPending || moveOutMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-slide-up">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            <Link
              to={agreementId ? `/agreements/${agreementId}` : '/agreements'}
              className="hover:text-primary hover:underline"
            >
              Agreement
            </Link>
            <span className="mx-1.5">/</span>
            Photo Lock
          </p>
          <div className="mt-2 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Move-in / Move-out photos</h1>
              <p className="mt-1 text-muted-foreground">
                Timestamped documentation that protects both tenant and owner during deposit
                disputes.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isError ? (
          <Card className="border-destructive/30">
            <CardContent className="space-y-4 py-12 text-center">
              <p className="text-destructive">
                {getApiErrorMessage(error, 'Failed to load photo lock')}
              </p>
              <Button asChild variant="outline">
                <Link to={agreementId ? `/agreements/${agreementId}` : '/agreements'}>
                  Back to agreement
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && photoLock ? (
          <div className="space-y-6">
            {!moveInSubmitted ? (
              <Card className="border-indigo-200/70 bg-gradient-to-b from-indigo-50/80 via-background to-violet-50/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Submit move-in photos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Capture the property condition on day one. This creates a fair baseline for
                    both parties if anything is disputed at move-out.
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isTenant ? (
                    <>
                      <AreaPhotoUploader
                        value={moveInSelections}
                        onChange={setMoveInSelections}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        className="w-full brand-gradient text-primary-foreground hover:opacity-90 sm:w-auto"
                        onClick={handleSubmitMoveIn}
                        disabled={isSubmitting || moveInSelections.length === 0}
                      >
                        {moveInMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Submit Move-In Photos
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <p className="text-sm text-amber-900">
                        Waiting for the tenant to submit move-in documentation.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {moveInSubmitted && !moveOutSubmitted ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Move-in photos</CardTitle>
                    {photoLock.moveIn.submittedAt ? (
                      <p className="text-sm text-muted-foreground">
                        Submitted {formatDateTime(photoLock.moveIn.submittedAt)}
                      </p>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <PhotoGrid photos={photoLock.moveIn.photos} />
                  </CardContent>
                </Card>

                <Card className="border-indigo-200/70 bg-gradient-to-b from-indigo-50/80 via-background to-violet-50/40 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Submit move-out photos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Photograph the same areas at move-out. We&apos;ll compare them with the
                      move-in set for an objective condition report.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {isTenant ? (
                      <>
                        <AreaPhotoUploader
                          value={moveOutSelections}
                          onChange={setMoveOutSelections}
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          className="w-full brand-gradient text-primary-foreground hover:opacity-90 sm:w-auto"
                          onClick={handleSubmitMoveOut}
                          disabled={isSubmitting || moveOutSelections.length === 0}
                        >
                          {moveOutMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting…
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Submit Move-Out Photos
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <p className="text-sm text-amber-900">
                          Move-in photos are locked. Waiting for the tenant to submit move-out
                          documentation.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}

            {moveOutSubmitted && !comparisonCompleted ? (
              <Card>
                <CardContent className="flex items-center gap-3 py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Generating comparison…</p>
                    <p className="text-sm text-muted-foreground">
                      Move-out photos are in. Our AI review is preparing the condition report.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {moveOutSubmitted && comparisonCompleted ? (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Move-in</CardTitle>
                      {photoLock.moveIn.submittedAt ? (
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(photoLock.moveIn.submittedAt)}
                        </p>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <PhotoGrid photos={photoLock.moveIn.photos} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Move-out</CardTitle>
                      {photoLock.moveOut.submittedAt ? (
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(photoLock.moveOut.submittedAt)}
                        </p>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <PhotoGrid photos={photoLock.moveOut.photos} />
                    </CardContent>
                  </Card>
                </div>

                <ComparisonReport comparison={photoLock.comparison} />
              </>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
