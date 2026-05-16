import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types/user.types';
import { cn } from '@/lib/utils';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
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

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleHome: Record<UserRole, string> = {
      tenant: '/tenant',
      owner: '/owner',
      admin: '/admin',
    };
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
}
