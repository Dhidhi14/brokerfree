import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { getDashboardPath } from '@/lib/role-routes';
import { cn } from '@/lib/utils';

interface GuestRouteProps {
  children: ReactNode;
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        className={cn(
          'h-10 w-10 animate-spin rounded-full border-4 border-muted',
          'border-t-primary'
        )}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
