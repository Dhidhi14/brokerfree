import { Link } from 'react-router-dom';
import { ClipboardList, Search } from 'lucide-react';
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
import { useAuthStore } from '@/store/auth-store';

export function TenantDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 animate-slide-up">
        <Badge variant="secondary" className="mb-4 capitalize">
          {user?.role ?? 'tenant'}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{user ? `, ${user.fullName}` : ''}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Browse verified homes and track your rental applications.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-primary" />
                Find a home
              </CardTitle>
              <CardDescription>Search verified listings across Indian metros.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="brand-gradient text-primary-foreground hover:opacity-90">
                <Link to="/properties">Browse properties</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                My Applications
              </CardTitle>
              <CardDescription>See status updates and withdraw pending applications.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/tenant/applications">View applications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
