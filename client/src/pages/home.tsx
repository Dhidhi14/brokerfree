import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-bold text-primary">BrokerFree</span>
          <nav className="flex gap-4 text-sm font-medium">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link
              to="/register"
              className={cn(
                'rounded-lg px-4 py-2 text-primary-foreground brand-gradient',
                'transition-opacity hover:opacity-90'
              )}
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

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
            to="/register"
            className={cn(
              'rounded-lg px-6 py-3 font-medium text-primary-foreground brand-gradient',
              'transition-opacity hover:opacity-90'
            )}
          >
            Get started
          </Link>
          <Link
            to="/login"
            className={cn(
              'rounded-lg border border-border px-6 py-3 font-medium',
              'hover:bg-muted'
            )}
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
