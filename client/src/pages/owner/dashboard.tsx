import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { KycStatusBadge } from '@/components/kyc/kyc-status-badge';
import { Navbar } from '@/components/layout/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useKycStatusQuery } from '@/hooks/use-kyc';
import { useAuthStore } from '@/store/auth-store';

export function OwnerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: kyc, isLoading: kycLoading } = useKycStatusQuery();

  const isVerified = kyc?.status === 'verified';

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 animate-slide-up">
        <Badge variant="secondary" className="mb-4 capitalize">
          {user?.role ?? 'owner'}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{user ? `, ${user.fullName}` : ''}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your owner dashboard is ready. Listings and tenant applications will appear here
          soon.
        </p>

        <Card className="mt-8">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Identity verification</CardTitle>
              <CardDescription>
                Verified owners can list properties on BrokerFree.
              </CardDescription>
            </div>
            {kycLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : kyc ? (
              <KycStatusBadge status={kyc.status} />
            ) : null}
          </CardHeader>
          <CardContent>
            {kycLoading ? (
              <p className="text-sm text-muted-foreground">Loading verification status…</p>
            ) : isVerified ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Your identity is verified. You can list properties.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete verification with your Aadhaar and PAN to start listing.
                </p>
                <Button
                  asChild
                  className="brand-gradient text-primary-foreground hover:opacity-90"
                >
                  <Link to="/owner/kyc">Complete verification</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
