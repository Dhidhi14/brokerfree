import { Link } from 'react-router-dom';
import { PageShell } from '@/components/common/page-shell';

export function RegisterPage() {
  return (
    <PageShell
      title="Create account"
      description="Registration form coming tomorrow."
    >
      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </PageShell>
  );
}
