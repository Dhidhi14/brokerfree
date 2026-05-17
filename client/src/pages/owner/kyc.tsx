import { useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentUploader } from '@/components/forms/document-uploader';
import { KycStatusBadge } from '@/components/kyc/kyc-status-badge';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useKycStatusQuery, useSubmitKycMutation } from '@/hooks/use-kyc';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/format-date';
import { kycSubmitSchema, type KycSubmitValues } from '@/lib/kyc-schemas';
import { cn } from '@/lib/utils';

function KycLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

function MaskedIds({
  aadhaarLast4,
  panLast4,
}: {
  aadhaarLast4?: string;
  panLast4?: string;
}) {
  return (
    <dl className="mt-4 space-y-2 text-sm">
      {aadhaarLast4 ? (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Aadhaar</dt>
          <dd className="font-mono">XXXX XXXX {aadhaarLast4}</dd>
        </div>
      ) : null}
      {panLast4 ? (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">PAN</dt>
          <dd className="font-mono">XXXXX{panLast4}X</dd>
        </div>
      ) : null}
    </dl>
  );
}

function KycSubmitForm({
  rejectionReason,
  onSuccess,
}: {
  rejectionReason?: string;
  onSuccess: () => void;
}) {
  const submitMutation = useSubmitKycMutation();
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);

  const form = useForm<KycSubmitValues>({
    resolver: zodResolver(kycSubmitSchema),
    mode: 'onChange',
    defaultValues: {
      aadhaarNumber: '',
      panNumber: '',
    },
  });

  const { isValid } = form.formState;
  const canSubmit = isValid && aadhaarFile !== null && panFile !== null;

  const onSubmit = (values: KycSubmitValues) => {
    if (!aadhaarFile || !panFile) return;

    const formData = new FormData();
    formData.append('aadhaarNumber', values.aadhaarNumber);
    formData.append('panNumber', values.panNumber);
    formData.append('aadhaarDoc', aadhaarFile);
    formData.append('panDoc', panFile);

    submitMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Documents submitted for review');
        onSuccess();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Failed to submit KYC'));
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit verification documents</CardTitle>
        <CardDescription>
          Upload your Aadhaar and PAN to verify your identity as a property owner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rejectionReason ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3"
          >
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Verification rejected</p>
                <p className="mt-1 text-sm text-destructive/90">{rejectionReason}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please correct the issues and resubmit.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar number</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="12-digit Aadhaar"
                      maxLength={12}
                      {...field}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                        field.onChange(digits);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="uppercase"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DocumentUploader
              label="Aadhaar document"
              selectedFile={aadhaarFile}
              onFileSelect={setAadhaarFile}
            />

            <DocumentUploader
              label="PAN document"
              selectedFile={panFile}
              onFileSelect={setPanFile}
            />

            <Button
              type="submit"
              disabled={!canSubmit || submitMutation.isPending}
              className="w-full brand-gradient text-primary-foreground hover:opacity-90"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit for verification'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function OwnerKycPage() {
  const { data: kyc, isLoading, isError, error, refetch } = useKycStatusQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 animate-slide-up md:py-12">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Identity verification
            </h1>
            <p className="mt-1 text-muted-foreground">
              Verify your identity to list properties on BrokerFree.
            </p>
          </div>
          {kyc ? <KycStatusBadge status={kyc.status} /> : null}
        </div>

        {isLoading ? <KycLoading /> : null}

        {isError ? (
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-destructive">
                {getApiErrorMessage(error, 'Failed to load verification status')}
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && kyc ? (
          <>
            {(kyc.status === 'not_submitted' || kyc.status === 'rejected') && (
              <KycSubmitForm
                rejectionReason={kyc.status === 'rejected' ? kyc.rejectionReason : undefined}
                onSuccess={() => void refetch()}
              />
            )}

            {kyc.status === 'pending' ? (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <Clock className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <CardTitle className="text-amber-900">Verification in progress</CardTitle>
                      <CardDescription className="text-amber-800/80">
                        We&apos;re reviewing your documents. This usually takes up to 2 minutes in
                        our demo.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {formatDateTime(kyc.submittedAt)}
                  </p>
                  <MaskedIds aadhaarLast4={kyc.aadhaarLast4} panLast4={kyc.panLast4} />
                </CardContent>
              </Card>
            ) : null}

            {kyc.status === 'verified' ? (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <CardTitle className="text-emerald-900">You&apos;re verified</CardTitle>
                      <CardDescription className="text-emerald-800/80">
                        Your identity has been confirmed. You can now list properties on
                        BrokerFree.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <MaskedIds aadhaarLast4={kyc.aadhaarLast4} panLast4={kyc.panLast4} />
                  <Button
                    asChild
                    className={cn('mt-6 brand-gradient text-primary-foreground hover:opacity-90')}
                  >
                    <Link to="/owner/properties/new">List a property</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
