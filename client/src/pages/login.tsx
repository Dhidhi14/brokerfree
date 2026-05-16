import { Link } from 'react-router-dom';
import { PageShell } from '@/components/common/page-shell';

export function LoginPage() {
  return (
    <PageShell
      title="Log in"
      description="Auth form coming tomorrow. Use this route for session testing."
    >
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </PageShell>
  );
}
