import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { VideoUploader } from '@/components/property/video-uploader';
import { VideoVerificationStatus } from '@/components/property/video-verification-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  usePropertyQuery,
  useSubmitVideoTourMutation,
  useVideoStatusQuery,
} from '@/hooks/use-properties';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/auth-store';
import type { PropertyOwnerSummary, VideoVerification } from '@/types/property.types';

const EMPTY_VERIFICATION: VideoVerification = {
  status: 'not_submitted',
  frameUrls: [],
  results: [],
  flaggedIssues: [],
};

function getOwnerId(owner: string | PropertyOwnerSummary): string {
  return typeof owner === 'string' ? owner : owner._id;
}

export function OwnerVideoTourPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [showUploader, setShowUploader] = useState(false);

  const {
    data: property,
    isLoading: isPropertyLoading,
    isError: isPropertyError,
    error: propertyError,
  } = usePropertyQuery(id);

  const isOwner =
    property && user ? getOwnerId(property.owner) === user._id : false;

  const {
    data: videoVerification,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useVideoStatusQuery(id, Boolean(property && isOwner));

  const submitMutation = useSubmitVideoTourMutation();

  const verification = videoVerification ?? property?.videoVerification ?? EMPTY_VERIFICATION;
  const status = verification.status;
  const shouldShowUploader = showUploader || status === 'not_submitted';

  const handleSubmit = (file: File) => {
    if (!id) return;

    const formData = new FormData();
    formData.append('video', file);

    submitMutation.mutate(
      { propertyId: id, formData },
      {
        onSuccess: () => {
          setShowUploader(false);
          toast.success('Video submitted — AI analysis started');
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to submit video tour'));
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-slide-up">
        <Link
          to="/owner/properties"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my properties
        </Link>

        {isPropertyLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isPropertyError ? (
          <Card className="border-destructive/30">
            <CardContent className="py-12 text-center">
              <p className="text-destructive">
                {getApiErrorMessage(propertyError, 'Property not found')}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/owner/properties">Back to my properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {property && !isOwner ? (
          <Card className="border-destructive/30">
            <CardContent className="py-12 text-center">
              <p className="text-destructive">You can only manage video tours for your own listings.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to={`/properties/${property._id}`}>View property</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {property && isOwner ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Video tour verification</h1>
              <p className="mt-2 text-muted-foreground">
                AI verifies your walkthrough against amenities listed for{' '}
                <span className="font-medium text-foreground">{property.title}</span>.
              </p>
            </div>

            {isStatusLoading && !videoVerification ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading status" />
              </div>
            ) : null}

            {isStatusError ? (
              <Card className="border-destructive/30">
                <CardContent className="py-8 text-center">
                  <p className="text-destructive">
                    {getApiErrorMessage(statusError, 'Failed to load verification status')}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {!isStatusLoading || videoVerification || property.videoVerification ? (
              <>
                {shouldShowUploader && status !== 'processing' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {status === 'failed' ? 'Upload a new video' : 'Upload video tour'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VideoUploader
                        onSubmit={handleSubmit}
                        isSubmitting={submitMutation.isPending}
                      />
                    </CardContent>
                  </Card>
                ) : null}

                {!shouldShowUploader || status === 'processing' || status === 'completed' ? (
                  <VideoVerificationStatus
                    videoVerification={verification}
                    onTryAgain={() => setShowUploader(true)}
                  />
                ) : null}

                {status === 'completed' && !showUploader ? (
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                      <Link to={`/properties/${property._id}`}>View public listing</Link>
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowUploader(true)}>
                      Re-submit video
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
