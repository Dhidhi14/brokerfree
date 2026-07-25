import { Link } from 'react-router-dom';
import { Building2, ChevronRight, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';

export function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 animate-slide-up md:py-12">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome{user ? `, ${user.fullName}` : ''}. Manage platform operations from here.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link to="/admin/verifications" className="group block">
            <Card className="transition-shadow hover:shadow-md">
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
            <Card className="transition-shadow hover:shadow-md">
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
        </div>
      </main>
    </div>
  );
}
