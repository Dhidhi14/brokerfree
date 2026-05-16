import { Link } from 'react-router-dom';
import { PageShell } from '@/components/common/page-shell';
import { cn } from '@/lib/utils';

export function NotFoundPage() {
  return (
    <PageShell title="Page not found" description="The page you're looking for doesn't exist.">
      <Link
        to="/"
        className={cn(
          'inline-flex rounded-lg px-4 py-2 font-medium text-primary-foreground brand-gradient',
          'transition-opacity hover:opacity-90'
        )}
      >
        Back to home
      </Link>
    </PageShell>
  );
}
