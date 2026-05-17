import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside
        className={cn(
          'relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex',
          'brand-gradient'
        )}
      >
        <div>
          <Link to="/" className="text-2xl font-bold tracking-tight">
            BrokerFree
          </Link>
          <p className="mt-6 max-w-sm text-lg font-medium leading-relaxed text-primary-foreground/95">
            Verified rentals for India — no brokers, no deposit surprises.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 opacity-90" />
            <div>
              <p className="font-semibold">Trust-first platform</p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Aadhaar-verified owners and escrow-protected deposits.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 opacity-90" />
            <div>
              <p className="font-semibold">AI-verified tours</p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                See real properties before you visit — skip broker listings.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-block text-xl font-bold text-primary lg:hidden"
          >
            BrokerFree
          </Link>
          {title ? (
            <div className="mb-8 animate-slide-up">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle ? (
                <p className="mt-2 text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
