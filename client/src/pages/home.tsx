import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { getDashboardPath } from '@/lib/role-routes';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

export function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  const getStartedTo =
    isAuthenticated && user ? getDashboardPath(user.role) : '/register';

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-16 text-center animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Verified rentals.
          <span className="block text-primary">No brokers.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Trust-first rental platform for India — escrow deposits, verified owners, and
          transparent agreements.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to={getStartedTo}
            className={cn(
              'rounded-lg px-6 py-3 font-medium text-primary-foreground brand-gradient',
              'transition-opacity hover:opacity-90'
            )}
          >
            Get started
          </Link>
          {!isAuthenticated ? (
            <Link
              to="/login"
              className={cn(
                'rounded-lg border border-border px-6 py-3 font-medium',
                'hover:bg-muted'
              )}
            >
              Log in
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
