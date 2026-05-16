import { useAuthStore } from '@/store/auth-store';
import { PageShell } from '@/components/common/page-shell';

export function OwnerDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell
      title="Owner dashboard"
      description={`Welcome${user ? `, ${user.fullName}` : ''}. Listings and applications will live here.`}
    />
  );
}
