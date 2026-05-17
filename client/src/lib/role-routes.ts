import type { UserRole } from '@/types/user.types';

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    tenant: '/tenant',
    owner: '/owner',
    admin: '/admin',
  };
  return paths[role];
}
