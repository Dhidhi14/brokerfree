import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  AiVerifiedBadge,
  matchScoreBgClass,
  matchScoreColorClass,
} from '@/components/property/ai-verified-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AMENITY_GROUPS } from '@/constants/property.constants';
import { cn } from '@/lib/utils';
import type { VideoVerification } from '@/types/property.types';

const AMENITY_LABELS = Object.fromEntries(
  [
    ...AMENITY_GROUPS.basic,
    ...AMENITY_GROUPS.comfort,
    ...AMENITY_GROUPS.building,
    ...AMENITY_GROUPS.security,
  ].map((item) => [item.value, item.label])
) as Record<string, string>;

function formatAmenityLabel(value: string): string {
  return (
    AMENITY_LABELS[value] ??
    value
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

interface VideoVerificationStatusProps {
  videoVerification: VideoVerification;
  onTryAgain?: () => void;
}

export function VideoVerificationStatus({
  videoVerification,
  onTryAgain,
}: VideoVerificationStatusProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const { status } = videoVerification;

  if (status === 'not_submitted') {
    return null;
  }

  if (status === 'processing') {
    return (
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/5 via-violet-50/60 to-background">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <span className="absolute inset-2 animate-pulse rounded-full bg-primary/15" />
            <Loader2 className="relative h-8 w-8 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Analyzing your video tour…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI is checking frames against your claimed amenities. This usually takes a minute.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Verification failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive/90">
            {videoVerification.errorMessage ||
              'Something went wrong while analyzing your video. Please try again.'}
          </p>
          {onTryAgain ? (
            <Button type="button" variant="outline" onClick={onTryAgain}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const score = videoVerification.overallMatchScore ?? 0;
  const results = videoVerification.results ?? [];
  const flaggedIssues = videoVerification.flaggedIssues ?? [];
  const frameUrls = videoVerification.frameUrls ?? [];

  return (
    <>
      <Card className="overflow-hidden border-primary/20">
        <div className={cn('bg-gradient-to-br px-6 py-8', matchScoreBgClass(score))}>
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 shadow-sm ring-1 ring-primary/10">
              <ShieldCheck className={cn('h-7 w-7', matchScoreColorClass(score))} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">AI video verification</p>
              <p className={cn('text-4xl font-bold tracking-tight', matchScoreColorClass(score))}>
                {Math.round(score)}% Match
              </p>
            </div>
            <AiVerifiedBadge score={score} size="md" />
          </div>
        </div>

        <CardContent className="space-y-6 pt-6">
          {results.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Amenity checks</h3>
              <ul className="space-y-2">
                {results.map((result) => {
                  const confidencePct = Math.round(result.confidence * 100);
                  return (
                    <li
                      key={result.amenity}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {result.detected ? (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <X className="h-4 w-4" />
                          </span>
                        )}
                        <span className="truncate text-sm font-medium">
                          {formatAmenityLabel(result.amenity)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-xs font-medium',
                          result.detected ? 'text-emerald-700' : 'text-amber-700'
                        )}
                      >
                        {confidencePct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {flaggedIssues.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Flagged issues
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-amber-900/90">
                {flaggedIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {frameUrls.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Extracted frames</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {frameUrls.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setLightboxUrl(url)}
                    className="shrink-0 overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-2 hover:ring-primary"
                  >
                    <img
                      src={url}
                      alt={`Verification frame ${index + 1}`}
                      className="h-20 w-28 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(lightboxUrl)} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none sm:rounded-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Verification frame</DialogTitle>
          </DialogHeader>
          {lightboxUrl ? (
            <img
              src={lightboxUrl}
              alt="Verification frame enlarged"
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
