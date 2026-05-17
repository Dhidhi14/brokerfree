import { Navbar } from '@/components/layout/navbar';
import { Badge } from '@/components/ui/badge';
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
          Your tenant dashboard is ready. Property search and applications will appear here
          soon.
        </p>
      </main>
    </div>
  );
}
