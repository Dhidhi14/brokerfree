import { useAuthStore } from '@/store/auth-store';
import { PageShell } from '@/components/common/page-shell';

export function TenantDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell
      title="Tenant dashboard"
      description={`Welcome${user ? `, ${user.fullName}` : ''}. Property search and applications will live here.`}
    />
  );
}
