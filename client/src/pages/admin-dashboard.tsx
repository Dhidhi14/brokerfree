import { useAuthStore } from '@/store/auth-store';
import { PageShell } from '@/components/common/page-shell';

export function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell
      title="Admin panel"
      description={`Welcome${user ? `, ${user.fullName}` : ''}. Verifications and disputes will live here.`}
    />
  );
}
