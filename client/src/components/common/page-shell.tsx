import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageShell({ title, description, children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12',
        className
      )}
    >
      <Link
        to="/"
        className="mb-8 text-sm font-medium text-primary hover:underline"
      >
        ← BrokerFree
      </Link>
      <h1 className="animate-slide-up text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 animate-fade-in text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}
