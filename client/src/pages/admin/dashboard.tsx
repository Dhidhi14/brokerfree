import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  IndianRupee,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { getAdminStats } from '@/api/admin.api';
import { Navbar } from '@/components/layout/navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  description: ReactNode;
  icon: ReactNode;
  href?: string;
  className?: string;
}

function StatCard({ title, value, description, icon, href, className }: StatCardProps) {
  const content = (
    <Card
      className={cn(
        'h-full transition-shadow',
        href && 'hover:shadow-md',
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight md:text-3xl">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="group block">
        {content}
      </Link>
    );
  }

  return content;
}

export function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await getAdminStats();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to load admin stats');
      }
      return response.data.stats;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 animate-slide-up md:py-12">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome{user ? `, ${user.fullName}` : ''}. Manage platform operations from here.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Platform overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live counts across users, listings, escrow, and reviews.
          </p>

          {isLoading ? (
            <div className="mt-6 flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading stats" />
            </div>
          ) : null}

          {isError ? (
            <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
              {getApiErrorMessage(error, 'Failed to load admin stats')}
            </div>
          ) : null}

          {stats ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Users"
                value={stats.users.total}
                description={`${stats.users.tenants} tenants · ${stats.users.owners} owners · ${stats.users.admins} admins`}
                icon={<Users className="h-4 w-4 text-primary" />}
              />
              <StatCard
                title="Live Properties"
                value={stats.properties.live}
                description={`${stats.properties.pendingVerification} pending verification`}
                icon={<Building2 className="h-4 w-4 text-primary" />}
              />
              <StatCard
                title="Pending KYC"
                value={stats.kyc.pendingCount}
                description={
                  stats.kyc.pendingCount > 0
                    ? 'Review owner verifications →'
                    : 'No pending submissions'
                }
                href={stats.kyc.pendingCount > 0 ? '/admin/verifications' : undefined}
                icon={<ShieldAlert className="h-4 w-4 text-primary" />}
              />
              <StatCard
                title="Applications"
                value={stats.applications.total}
                description={`${stats.applications.pending} pending review`}
                icon={<ClipboardList className="h-4 w-4 text-primary" />}
              />
              <StatCard
                title="Escrow Held"
                value={formatCurrency(stats.escrow.heldTotalAmount)}
                description={
                  stats.escrow.disputedCount > 0
                    ? `${stats.escrow.heldCount} held · ${stats.escrow.disputedCount} disputed →`
                    : `${stats.escrow.heldCount} deposits currently held`
                }
                href={stats.escrow.disputedCount > 0 ? '/admin/escrow' : undefined}
                icon={<IndianRupee className="h-4 w-4 text-primary" />}
              />
              <StatCard
                title="Executed Agreements"
                value={stats.agreements.executed}
                description={`${stats.agreements.total} total agreements`}
                icon={<FileText className="h-4 w-4 text-primary" />}
              />
              <StatCard
                title="Avg Platform Rating"
                value={
                  stats.reviews.total > 0
                    ? stats.reviews.averagePlatformRating.toFixed(1)
                    : '—'
                }
                description={
                  stats.reviews.total > 0
                    ? `From ${stats.reviews.total} review${stats.reviews.total === 1 ? '' : 's'}`
                    : 'No reviews yet'
                }
                icon={<Star className="h-4 w-4 text-primary" />}
              />
            </div>
          ) : null}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump into verification queues and escrow disputes.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/admin/verifications" className="group block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">Owner Verifications</CardTitle>
                  <CardDescription className="mt-1">
                    Review pending KYC submissions and approve or reject owners.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/property-verifications" className="group block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">Property Verifications</CardTitle>
                  <CardDescription className="mt-1">
                    Review pending property listings before they appear in search.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/escrow" className="group block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IndianRupee className="h-5 w-5 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">Escrow Management</CardTitle>
                  <CardDescription className="mt-1">
                    Resolve disputed deposits and release or refund held funds.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
